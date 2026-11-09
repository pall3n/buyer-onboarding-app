---
status: complete
priority: p3
issue_id: "013"
tags: [code-review, typescript, quality]
dependencies: []
---

# 013 — OpenAI Realtime data channel events are weakly typed inline

## Problem Statement

`useVoiceSession.ts` manually annotates the OpenAI Realtime data channel event shape as an inline type literal. This is brittle: if OpenAI changes the event schema, TypeScript won't catch it. The `openai` SDK (v7) may already export types for Realtime events that could be used instead.

## Findings

**`src/hooks/useVoiceSession.ts:112-114`**
```typescript
let event: { type: string; item?: { content?: Array<{ type: string; transcript?: string }>; role?: string }; transcript?: string }
try {
  event = JSON.parse(e.data as string) as typeof event
}
```
Manually maintained type annotation. Any new event fields (e.g., `response.audio_transcript.delta`, `error` events) would need to be added manually.

## Proposed Solutions

### Option A: Use OpenAI SDK Realtime event types (Recommended)
Check if `openai` v7 exports Realtime event types:
```typescript
import type { RealtimeServerEvent } from 'openai/resources/beta/realtime'
// or similar path
```
If available, use the union type for the parsed event.

**Pros:** Type-safe against SDK updates. Auto-completes in IDE.
**Cons:** Requires checking if the type is exported in the installed version (openai@7.53.0).
**Effort:** Small | **Risk:** Low

### Option B: Create a local discriminated union type
Define a local union covering only the events actually handled:
```typescript
type RealtimeEvent =
  | { type: 'input_audio_buffer.speech_started' }
  | { type: 'input_audio_buffer.speech_stopped' }
  | { type: 'conversation.item.created'; item: { role?: string; content?: Array<{ type: string; transcript?: string }> } }
  | { type: 'response.audio.started' }
  | { type: 'response.audio_transcript.done'; transcript: string }
  | { type: 'response.done' }
  | { type: string }  // catch-all for unhandled events
```

**Pros:** Explicit. No external dependency.
**Cons:** Still manually maintained.
**Effort:** Small | **Risk:** None

## Technical Details

**Affected files:**
- `src/hooks/useVoiceSession.ts:112-130`

## Acceptance Criteria

- [ ] The parsed data channel event has a named type (not anonymous inline literal)
- [ ] The switch statement on `event.type` benefits from TypeScript narrowing

## Work Log

- 2026-11-07: Identified during M5 TypeScript review.
