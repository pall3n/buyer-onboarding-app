---
status: complete
priority: p2
issue_id: "004"
tags: [code-review, architecture, quality]
dependencies: []
---

# 004 — Voice turns always display after text turns regardless of actual order

## Problem Statement

`ConversationPageClient` maintains two separate turn arrays (`textTurns` from `useChat` and `voiceTurns` from state) and merges them as `[...textTurns, ...voiceTurns]`. This means voice turns always appear after all text turns in the UI, regardless of when they happened. A mixed-modality conversation (text → voice → text → voice) will display out of order.

## Findings

**`src/components/buyer/ConversationPageClient.tsx:68-69`**
```typescript
const textTurns = messagesToTurns(messages)
const allTurns = [...textTurns, ...voiceTurns]
```

**Example broken scenario:**
1. Buyer types "Hello" → AI responds (text turn 1 & 2)
2. Buyer speaks a preference (voice turn 3 & 4)
3. Buyer types a follow-up (text turn 5 & 6)

Displayed order: turns 1, 2, 5, 6 (text), then 3, 4 (voice) — wrong.

## Proposed Solutions

### Option A: Add timestamp to voice turns on creation (Recommended)
When voice turns are added to `voiceTurns` state, attach the current ISO timestamp. When merging with text turns, sort the combined array by timestamp.

```typescript
setVoiceTurns(prev => [
  ...prev,
  { role: 'buyer', text: userText, timestamp: new Date().toISOString() },
  { role: 'ai', text: assistantText, timestamp: new Date().toISOString() },
])

// In render:
const allTurns = [...textTurns, ...voiceTurns]
  .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
```

`messagesToTurns` already returns `timestamp: ''` — when sorting, empty-string timestamps (text turns) could be ordered by their position in the messages array by adding an index-based fallback.

**Pros:** Preserves actual conversation chronology.
**Cons:** Text turns from `useChat` don't have timestamps — need to assign synthetic ones (message index).
**Effort:** Small | **Risk:** Low

### Option B: Unify voice and text into a single turns array
Add a `useCallback`-wrapped `appendTurn` to the client that both `useChat`'s `onFinish` callback and `onTurnComplete` write to. Remove the two-array merge.
**Pros:** Single source of truth.
**Cons:** Requires rearchitecting `useChat` integration — higher risk.
**Effort:** Medium | **Risk:** Medium

### Option C: Accept current behaviour (Defer)
Mixed modality is an edge case in the demo. Users are unlikely to mix voice and text in a single session.
**Effort:** None | **Risk:** Low for MVP

## Technical Details

**Affected files:**
- `src/components/buyer/ConversationPageClient.tsx:68-69`
- `src/features/conversation/index.ts` (`messagesToTurns` — add synthetic timestamp)
- `src/lib/demo-data.ts` (`ConversationTurn` type — `timestamp` already exists as `string`)

## Acceptance Criteria

- [ ] A conversation with interleaved text and voice turns displays in chronological order
- [ ] Text-only conversations unaffected
- [ ] Voice-only conversations unaffected

## Work Log

- 2026-11-07: Identified during M5 architecture review.
