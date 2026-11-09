---
status: complete
priority: p2
issue_id: "002"
tags: [code-review, security, performance]
dependencies: []
---

# 002 — Rate-limit the ephemeral token endpoint to prevent cost abuse

## Problem Statement

`POST /api/conversation/realtime/token` creates a new OpenAI Realtime session on every call. Each Realtime session costs money (audio minutes billed by OpenAI). A buyer with a valid session can call this endpoint in a tight loop, creating thousands of Realtime sessions without ever using them. There is no rate limiting, no per-session cap, and no token TTL enforcement at the app layer.

## Findings

**`src/app/api/conversation/realtime/token/route.ts:11-18`**
```typescript
const openai = new OpenAI()
const rtSession = await openai.beta.realtime.sessions.create({ ... })
return Response.json({ ephemeralToken: rtSession.client_secret.value })
```
No rate check before calling OpenAI. Session validation confirms the buyer is real, but doesn't prevent repeated calls.

## Proposed Solutions

### Option A: Track token issuance in DB with a cooldown (Recommended)
Before calling OpenAI, check if a token was issued for this `sessionId` within the last N seconds (e.g., 10s). Store a `realtime_token_issued_at` column on `buyer_sessions` or a lightweight Redis key.

```typescript
// Before calling OpenAI:
const { data: session } = await admin
  .from('buyer_sessions')
  .select('last_token_issued_at')
  .eq('id', sessionId)
  .single()

const cooldown = 10_000 // 10 seconds
if (session?.last_token_issued_at) {
  const elapsed = Date.now() - new Date(session.last_token_issued_at).getTime()
  if (elapsed < cooldown) {
    return new Response('Too Many Requests', { status: 429 })
  }
}
// ... call OpenAI, then update last_token_issued_at
```

**Pros:** Persistent across server restarts. Accurate.
**Cons:** Extra DB roundtrip per call; requires schema change.
**Effort:** Medium | **Risk:** Low

### Option B: In-memory per-session rate limit (Simple)
Use a `Map<sessionId, timestamp>` module-level cache with a 10-second window.
**Pros:** No DB change needed. Fast.
**Cons:** Resets on server restart/cold start. Doesn't work across multiple Next.js instances (Vercel serverless).
**Effort:** Small | **Risk:** Medium (ineffective on serverless)

### Option C: Rely on OpenAI's own rate limits (Defer)
Accept the risk for now. OpenAI has account-level rate limits and billing alerts.
**Pros:** No code change.
**Cons:** Could result in unexpected charges before limits kick in.
**Effort:** None | **Risk:** Medium

## Technical Details

**Affected files:**
- `src/app/api/conversation/realtime/token/route.ts`
- Possibly `supabase/migrations/` (for DB option)

## Acceptance Criteria

- [ ] Rapid repeat calls (< 10s) to the token endpoint return 429
- [ ] Normal usage (mic button click → voice session) still works
- [ ] Rate limit is enforced per buyer session, not globally

## Work Log

- 2026-11-07: Identified during M5 security review.
