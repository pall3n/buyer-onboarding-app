---
status: complete
priority: p2
issue_id: "006"
tags: [code-review, performance]
dependencies: []
---

# 006 — Waveform analyser runs React state updates at 60fps, causing excessive re-renders

## Problem Statement

The `useVoiceSession` hook's animation loop calls `setLevels(newLevels)` on every `requestAnimationFrame` tick — 60 times per second. Each `setLevels` call schedules a React re-render of the entire `ConversationPageClient` component tree (which includes `ConversationThread`, `HomeBriefSummary`, and `VoiceDock`). This causes significant render pressure while the user is speaking.

## Findings

**`src/hooks/useVoiceSession.ts:55-62`**
```typescript
function tick() {
  analyser.getByteFrequencyData(buf)
  const newLevels = Array.from({ length: NUM_BARS }, (_, i) =>
    (buf[i * step] ?? 0) / 255
  )
  setLevels(newLevels)  // ← React state update at 60fps
  animFrameRef.current = requestAnimationFrame(tick)
}
```

The 5 waveform bars only need to update at ~10fps to look smooth to a human eye.

## Proposed Solutions

### Option A: Throttle state updates to ~10fps (Recommended)
Add a frame counter and only call `setLevels` every 6th frame:

```typescript
let frame = 0
function tick() {
  analyser.getByteFrequencyData(buf)
  if (++frame % 6 === 0) {  // ~10fps
    const newLevels = Array.from({ length: NUM_BARS }, (_, i) =>
      (buf[i * step] ?? 0) / 255
    )
    setLevels(newLevels)
  }
  animFrameRef.current = requestAnimationFrame(tick)
}
```

**Pros:** 6x reduction in React re-renders. Visually imperceptible difference. Minimal code change.
**Cons:** None.
**Effort:** Trivial | **Risk:** None

### Option B: Use a ref + direct DOM updates (Best performance)
Store levels in a ref. Write bar heights directly to DOM elements via refs instead of React state. No React re-renders at all.

```typescript
const barRefs = useRef<HTMLSpanElement[]>([])
// In tick():
bars.forEach((level, i) => {
  if (barRefs.current[i]) {
    barRefs.current[i].style.height = `${Math.max(4, level * 20)}px`
  }
})
```

**Pros:** Zero re-renders. Best possible performance.
**Cons:** Requires DOM refs to be threaded from hook → component → waveform bars. More invasive refactor.
**Effort:** Medium | **Risk:** Low

### Option C: Move levels state to VoiceDock internal state
Keep levels updates isolated to VoiceDock by passing the analyser node as a prop and running the RAF loop inside VoiceDock. Only VoiceDock re-renders at 60fps, not ConversationPageClient.
**Effort:** Medium | **Risk:** Low

## Technical Details

**Affected files:**
- `src/hooks/useVoiceSession.ts:55-62`

## Acceptance Criteria

- [ ] Waveform animation still looks smooth during voice input
- [ ] React DevTools profiler shows ≤10 renders/second during listening state (instead of 60)
- [ ] No visual regression on the waveform bars

## Work Log

- 2026-11-07: Identified during M5 performance review.
