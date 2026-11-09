---
status: complete
priority: p2
issue_id: "005"
tags: [code-review, architecture, quality]
dependencies: []
---

# 005 — Voice preference extraction only sees single turn, not full conversation history

## Problem Statement

The voice persist route passes only the current user utterance to `extractAndPersist`, while the text conversation route passes the full conversation history. This means Claude Haiku cannot see previously established preferences when processing a voice turn, leading to incomplete or incorrect preference extraction (e.g., preferences mentioned earlier in text turns will be ignored during voice extraction and may get overwritten when `upsertPreferences` runs `DELETE` + `INSERT`).

## Findings

**`src/app/api/conversation/realtime/persist/route.ts:20-22`**
```typescript
const modelMessages = [
  { role: 'user' as const, content: userText },
]
extractAndPersist(modelMessages, assistantText, versionId)
```
Only the single voice user turn is passed as context.

**`src/app/api/conversation/route.ts:52`**
```typescript
const modelMessages = await convertToModelMessages(messages)
extractAndPersist(modelMessages, assistantText, versionId)
```
Full conversation history (all UIMessages) is passed.

**`src/features/preferences/index.ts:355-363` (`upsertPreferences`)**
```typescript
await admin.from('profile_preferences').delete().eq('version_id', versionId)
await admin.from('profile_preferences').insert(rows)
```
Every extraction run **deletes all existing preferences and replaces them**. So a voice extraction with only partial context can wipe out preferences correctly established by earlier text turns.

## Proposed Solutions

### Option A: Load full conversation history in persist route (Recommended)
Load all existing turns from `conversation_turns` before calling `extractAndPersist`:

```typescript
import { loadConversationTurns } from '@/features/conversation/index'
// ...
await appendTurn(session.sessionId, 'user', userText)
await appendTurn(session.sessionId, 'assistant', assistantText)

const allTurns = await loadConversationTurns(session.sessionId)
const modelMessages = allTurns.map(t => ({
  role: (t.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
  content: t.text,
}))
extractAndPersist(modelMessages, assistantText, versionId)
```

**Pros:** Extraction quality matches text mode. Consistent behaviour.
**Cons:** Extra DB query per voice turn. Slightly higher latency (but `extractAndPersist` is fire-and-forget so doesn't affect response time).
**Effort:** Small | **Risk:** Low

### Option B: Change upsertPreferences to merge rather than replace
Instead of `DELETE` + `INSERT`, do an `UPSERT` keyed on `(version_id, category, key)`. This way, voice turns only update the keys they discover.
**Pros:** More resilient to partial extraction.
**Cons:** Harder to clear preferences that the buyer has explicitly retracted.
**Effort:** Medium | **Risk:** Medium

## Technical Details

**Affected files:**
- `src/app/api/conversation/realtime/persist/route.ts`
- `src/features/conversation/index.ts` (import `loadConversationTurns`)

## Acceptance Criteria

- [ ] Voice preference extraction receives the full conversation history, not just the current turn
- [ ] Preferences established in text turns are preserved after a voice turn runs extraction
- [ ] Test: add a unit test for the persist route that verifies loadConversationTurns is called

## Work Log

- 2026-11-07: Identified during M5 architecture review.
