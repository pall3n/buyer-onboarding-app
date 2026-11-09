---
status: complete
priority: p2
issue_id: "001"
tags: [code-review, security, typescript, quality]
dependencies: []
---

# 001 — Add Zod validation to realtime route request bodies

## Problem Statement

Both realtime API routes use unsafe TypeScript casts on `request.json()` with no runtime validation. If the request body is malformed JSON, missing required fields, or contains unexpected types, the route either throws an unhandled exception (500) or silently passes wrong types to downstream functions (DB writes, OpenAI calls).

Additionally the `persist` route accepts `userText` and `assistantText` with no length cap. A buyer with a valid session could POST arbitrarily large strings, filling up `conversation_turns` with unchecked content.

## Findings

**`src/app/api/conversation/realtime/token/route.ts:6`**
```typescript
const { opaqueId } = await request.json() as { opaqueId: string }
```
No validation — missing/non-string `opaqueId` passes through silently.

**`src/app/api/conversation/realtime/persist/route.ts:6-10`**
```typescript
const { opaqueId, userText, assistantText } = await request.json() as {
  opaqueId: string
  userText: string
  assistantText: string
}
```
No length limits. No type enforcement. Malformed body causes unhandled throw.

**Comparison:** The main conversation route (`src/app/api/conversation/route.ts:20-23`) has the same pattern — this is a systemic gap.

## Proposed Solutions

### Option A: Add Zod parsing with early 400 returns (Recommended)
Add a Zod schema at the top of each route. Parse the body. Return `400 Bad Request` on failure.

```typescript
import { z } from 'zod'

const TokenRequestSchema = z.object({ opaqueId: z.string().min(1).max(200) })

const body = await request.json().catch(() => null)
const parsed = TokenRequestSchema.safeParse(body)
if (!parsed.success) return new Response('Bad Request', { status: 400 })
const { opaqueId } = parsed.data
```

For persist:
```typescript
const PersistRequestSchema = z.object({
  opaqueId: z.string().min(1).max(200),
  userText: z.string().max(10_000),
  assistantText: z.string().max(10_000),
})
```

**Pros:** Consistent with how `createInvitationAction` validates via `CreateInvitationFormSchema`. Zod already in deps. Clear error messages.
**Cons:** Small code addition.
**Effort:** Small | **Risk:** Low

### Option B: Minimal null-check guards (Fast fix)
Check for string type only without Zod:
```typescript
const body = await request.json().catch(() => ({})) as Record<string, unknown>
const opaqueId = typeof body.opaqueId === 'string' ? body.opaqueId : null
if (!opaqueId) return new Response('Bad Request', { status: 400 })
```
**Pros:** No library needed.
**Cons:** Doesn't enforce length limits. Less idiomatic than Zod pattern used elsewhere.
**Effort:** Small | **Risk:** Low

## Technical Details

**Affected files:**
- `src/app/api/conversation/realtime/token/route.ts`
- `src/app/api/conversation/realtime/persist/route.ts`
- (Optional: also apply to `src/app/api/conversation/route.ts`)

## Acceptance Criteria

- [ ] `POST /api/conversation/realtime/token` with missing `opaqueId` returns 400
- [ ] `POST /api/conversation/realtime/token` with malformed JSON returns 400
- [ ] `POST /api/conversation/realtime/persist` with oversized `userText` returns 400
- [ ] Valid requests continue to work
- [ ] No `as { ... }` cast used for request body parsing in these routes

## Work Log

- 2026-11-07: Identified during code review of M5 implementation.

## Resources

- `src/app/(agency)/buyers/invite/actions.ts` — existing pattern using `CreateInvitationFormSchema.safeParse(rawData)`
