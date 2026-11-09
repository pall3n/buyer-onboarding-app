---
status: complete
priority: p2
issue_id: "010"
tags: [code-review, quality, typescript]
dependencies: []
---

# 010 — refreshBrief not in useCallback causes stale closure + ESLint suppression

## Problem Statement

`refreshBrief` is defined as a plain inline function inside `ConversationPageClient`. It is called from two places: a `useEffect` and the `onTurnComplete` closure of `useVoiceSession`. Because it's not wrapped in `useCallback`, React's exhaustive-deps rule correctly flags it as a missing dependency — the ESLint suppression comment masks this. The `onTurnComplete` closure passed to `useVoiceSession` captures the initial `refreshBrief` and never gets an updated version if `opaqueId` changes (though in practice `opaqueId` is a stable prop, the pattern is fragile).

## Findings

**`src/components/buyer/ConversationPageClient.tsx:52-57`**
```typescript
function refreshBrief() {
  fetch(`/api/conversation/brief?opaqueId=${encodeURIComponent(opaqueId)}`)
    ...
}
```
Defined inline, recreated on every render.

**`src/components/buyer/ConversationPageClient.tsx:69-72`**
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [status, opaqueId])
```
`refreshBrief` is called inside the effect but not in the deps array — masked by suppression.

**`src/components/buyer/ConversationPageClient.tsx:74-85`**
```typescript
const { voiceState, levels, startVoice, stopVoice, interrupt } = useVoiceSession({
  opaqueId,
  onTurnComplete: async (userText, assistantText) => {
    ...
    refreshBrief()  // captures stale reference
  },
})
```
`onTurnComplete` is recreated every render too (passed as `useVoiceSession` prop), which causes `useVoiceSession`'s `useCallback` dependencies to be invalidated constantly.

## Proposed Solutions

### Option A: Wrap refreshBrief in useCallback (Recommended)
```typescript
const refreshBrief = useCallback(() => {
  fetch(`/api/conversation/brief?opaqueId=${encodeURIComponent(opaqueId)}`)
    .then(r => r.json())
    .then(({ brief, topicsDone: td }) => {
      setBriefData(brief)
      setTopicsDone(td)
    })
    .catch(() => {})
}, [opaqueId])
```
Then remove the ESLint suppression and add `refreshBrief` to the effect's deps array.

**Pros:** Correct React patterns. Removes ESLint suppression. Stable reference into `useVoiceSession`.
**Cons:** None.
**Effort:** Small | **Risk:** None

## Technical Details

**Affected files:**
- `src/components/buyer/ConversationPageClient.tsx`

## Acceptance Criteria

- [ ] `refreshBrief` is wrapped in `useCallback`
- [ ] ESLint suppression comment removed
- [ ] `refreshBrief` appears in the `useEffect` dependency array
- [ ] `pnpm lint` and `pnpm typecheck` pass with 0 warnings

## Work Log

- 2026-11-07: Identified during M5 quality review.
