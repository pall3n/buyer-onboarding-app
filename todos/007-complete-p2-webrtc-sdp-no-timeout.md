---
status: complete
priority: p2
issue_id: "007"
tags: [code-review, performance, reliability]
dependencies: []
---

# 007 — WebRTC SDP exchange has no timeout — hangs indefinitely if OpenAI is slow

## Problem Statement

The SDP offer sent to `api.openai.com` in `useVoiceSession.startVoice()` uses a plain `fetch` with no `AbortController` timeout. If OpenAI's Realtime API is slow or unavailable, `startVoice` hangs indefinitely in the `listening` state. The user sees the listening UI with no indication that the connection is stalled, and no way to recover except closing the browser tab.

## Findings

**`src/hooks/useVoiceSession.ts:143-152`**
```typescript
const sdpRes = await fetch(`${REALTIME_URL}?model=${REALTIME_MODEL}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ephemeralToken}`,
    'Content-Type': 'application/sdp',
  },
  body: offer.sdp,
})
```
No `signal: AbortSignal.timeout(...)`. No fallback.

## Proposed Solutions

### Option A: Add AbortSignal.timeout (Recommended)
```typescript
const sdpRes = await fetch(`${REALTIME_URL}?model=${REALTIME_MODEL}`, {
  method: 'POST',
  headers: { ... },
  body: offer.sdp,
  signal: AbortSignal.timeout(10_000),  // 10 second timeout
})
```
On timeout, the existing `catch` block will fire, calling `cleanupConnection()` and setting `voiceState = 'error'`. The user sees the error state with a Retry button.

**Pros:** One-line fix. Uses modern Web API (`AbortSignal.timeout` available in all modern browsers). Clean fallback to error state.
**Cons:** None.
**Effort:** Trivial | **Risk:** None

### Option B: AbortController with Promise.race
Manually set up `AbortController` + `setTimeout` for older browser compatibility.
**Effort:** Small | **Risk:** None

## Technical Details

**Affected files:**
- `src/hooks/useVoiceSession.ts:143-152`

Also consider adding a timeout to the token fetch at line ~106:
```typescript
const res = await fetch('/api/conversation/realtime/token', {
  method: 'POST',
  signal: AbortSignal.timeout(5_000),
  ...
})
```

## Acceptance Criteria

- [ ] If OpenAI SDP endpoint takes > 10 seconds, the hook transitions to `error` state
- [ ] The Retry button in `ErrorContent` re-calls `startVoice`
- [ ] No hanging `listening` state on network failure

## Work Log

- 2026-11-07: Identified during M5 performance/reliability review.
