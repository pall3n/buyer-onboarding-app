import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: vi.fn(),
}))

import { getAdminClient } from '@/lib/supabase/admin'
import { loadPropertyWithFacts } from '@/features/properties/index'

function makeQueryChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(result)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('loadPropertyWithFacts', () => {
  it('returns null when property not found', async () => {
    const admin = {
      from: vi.fn().mockReturnValue(makeQueryChain({ data: null, error: null })),
    }
    vi.mocked(getAdminClient).mockReturnValue(admin as never)

    const result = await loadPropertyWithFacts('unknown-id')
    expect(result).toBeNull()
  })

  it('returns property and facts when found', async () => {
    const propertyRow = {
      data: {
        id: '00000000-0000-0000-0000-000000000020',
        address_line1: 'Larkfield House',
        postcode: 'TN15 7RU',
        asking_price: 87500000,
        revision: 1,
      },
      error: null,
    }

    const factsRows = {
      data: [
        {
          id: 'f1',
          category: 'bedrooms',
          key: 'count',
          typed_value: { value: 4 },
          verification_state: 'verified',
          property_fact_sources: [],
        },
      ],
      error: null,
    }

    // from() is called twice — once for properties, once for property_facts
    const admin = {
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(propertyRow),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue(factsRows),
        }),
    }
    vi.mocked(getAdminClient).mockReturnValue(admin as never)

    const result = await loadPropertyWithFacts('00000000-0000-0000-0000-000000000020')
    expect(result).not.toBeNull()
    expect(result!.property.addressLine1).toBe('Larkfield House')
    expect(result!.property.askingPrice).toBe(87500000)
    expect(result!.facts).toHaveLength(1)
    expect(result!.facts[0].typedValue).toBe(4)
    expect(result!.facts[0].verificationState).toBe('verified')
  })
})
