import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock next/headers (cookies) ─────────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// ─── Mock Supabase admin ──────────────────────────────────────────────────────

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(),
}))

// ─── Mock OpenAI SDK ──────────────────────────────────────────────────────────

const mockSessionCreate = vi.fn()
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    beta: {
      realtime: {
        sessions: {
          create: mockSessionCreate,
        },
      },
    },
  })),
}))

import { cookies } from 'next/headers'
import { getAdminClient } from '@/lib/supabase/admin'
import { POST } from '@/app/api/conversation/realtime/token/route'

function makeCookieStore(sessionId: string | null) {
  return {
    get: (name: string) => (name === 'bi_buyer_session' && sessionId ? { value: sessionId } : undefined),
  }
}

function makeAdminClient(session: object | null, invitation: object | null) {
  const selectSingle = (data: object | null) => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data }) }) }),
  })
  const updateChain = { update: () => ({ eq: () => Promise.resolve({ error: null }) }) }
  return {
    from: (table: string) => {
      if (table === 'buyer_sessions') return { ...selectSingle(session), ...updateChain }
      if (table === 'buyer_invitations') return selectSingle(invitation)
      return selectSingle(null)
    },
  }
}

describe('POST /api/conversation/realtime/token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ephemeral token for valid session', async () => {
    vi.mocked(cookies).mockResolvedValue(makeCookieStore('sess-123') as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)
    vi.mocked(getAdminClient).mockReturnValue(
      makeAdminClient(
        { id: 'sess-123', subject_id: 'subj-1', invitation_id: 'inv-1', state: 'active', expires_at: new Date(Date.now() + 3600_000).toISOString() },
        { agency_id: 'agency-1' }
      ) as unknown as ReturnType<typeof getAdminClient>
    )
    mockSessionCreate.mockResolvedValue({
      client_secret: { value: 'eph_abc123' },
    })

    const req = new Request('http://localhost/api/conversation/realtime/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opaqueId: 'real-session-id' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { ephemeralToken: string }
    expect(body.ephemeralToken).toBe('eph_abc123')
  })

  it('returns 401 when no session cookie', async () => {
    vi.mocked(cookies).mockResolvedValue(makeCookieStore(null) as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)
    vi.mocked(getAdminClient).mockReturnValue(
      makeAdminClient(null, null) as unknown as ReturnType<typeof getAdminClient>
    )

    const req = new Request('http://localhost/api/conversation/realtime/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opaqueId: 'no-session' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 for demo opaqueId', async () => {
    vi.mocked(cookies).mockResolvedValue(makeCookieStore('sess-123') as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)

    const req = new Request('http://localhost/api/conversation/realtime/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opaqueId: 'demo-conv-maya' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    // OpenAI should never be called for demo IDs
    expect(mockSessionCreate).not.toHaveBeenCalled()
  })
})
