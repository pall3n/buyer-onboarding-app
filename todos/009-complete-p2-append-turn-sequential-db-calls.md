---
status: complete
priority: p2
issue_id: "009"
tags: [code-review, performance]
dependencies: []
---

# 009 — appendTurn makes 4 sequential DB round-trips to persist one voice turn

## Problem Statement

The voice persist route calls `appendTurn` twice (user then assistant), and each `appendTurn` call runs `getNextTurnIndex` (a SELECT) + an INSERT — 4 sequential DB round-trips total. This is avoidable: both turns are known upfront, the index can be computed once, and both rows can be inserted together.

## Findings

**`src/app/api/conversation/realtime/persist/route.ts:15-16`**
```typescript
await appendTurn(session.sessionId, 'user', userText)
await appendTurn(session.sessionId, 'assistant', assistantText)
```

**`src/features/conversation/index.ts:6-32`** (`appendTurn`)
```typescript
async function getNextTurnIndex(sessionId: string): Promise<number> { ... }  // 1 query

export async function appendTurn(sessionId, role, content): Promise<void> {
  const admin = getAdminClient()
  const turnIndex = await getNextTurnIndex(sessionId)  // query 1
  await admin.from('conversation_turns').insert({ ... })  // query 2
}
```
Two calls = 4 DB round-trips (2 SELECT + 2 INSERT).

## Proposed Solutions

### Option A: Add an `appendTurnPair` helper (Recommended)
Add a function that fetches the current max index once and inserts both rows:

```typescript
export async function appendTurnPair(
  sessionId: string,
  userContent: string,
  assistantContent: string
): Promise<void> {
  const admin = getAdminClient()
  const baseIndex = await getNextTurnIndex(sessionId)  // 1 query
  await admin.from('conversation_turns').insert([
    { session_id: sessionId, role: 'user', content: userContent, turn_index: baseIndex },
    { session_id: sessionId, role: 'assistant', content: assistantContent, turn_index: baseIndex + 1 },
  ])  // 1 query (batch insert)
}
```
2 queries instead of 4.

**Pros:** 2x reduction in DB calls. Atomic insertion of both turns.
**Cons:** New helper function. Slightly less reusable.
**Effort:** Small | **Risk:** Low

### Option B: Accept current behaviour
4 DB round-trips per voice turn is acceptable for MVP. Supabase connection pooling makes this fast enough.
**Effort:** None | **Risk:** Low

## Technical Details

**Affected files:**
- `src/features/conversation/index.ts` (add `appendTurnPair`)
- `src/app/api/conversation/realtime/persist/route.ts` (use `appendTurnPair`)

## Acceptance Criteria

- [ ] Voice turn persistence results in ≤2 DB queries for the turn write
- [ ] User and assistant turns are written atomically (or as close as possible)
- [ ] Existing `appendTurn` function and all existing callers unaffected

## Work Log

- 2026-11-07: Identified during M5 performance review.
