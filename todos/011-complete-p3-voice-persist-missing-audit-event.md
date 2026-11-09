---
status: complete
priority: p3
issue_id: "011"
tags: [code-review, quality]
dependencies: []
---

# 011 — Voice persist route does not log an audit event

## Problem Statement

The text conversation route logs `conversation.turn_completed` audit events for every turn. The voice persist route does not log any audit event. This creates an asymmetry in the audit trail — voice turns are invisible to any audit log review, making it harder to debug issues or satisfy compliance requirements.

## Findings

**`src/app/api/conversation/route.ts:81-87`**
```typescript
void logAuditEvent({
  actorType: 'buyer',
  actorId: session.subjectId,
  agencyId: session.agencyId,
  action: 'conversation.turn_completed',
})
```

**`src/app/api/conversation/realtime/persist/route.ts`** — no `logAuditEvent` call present.

## Proposed Solutions

### Option A: Add logAuditEvent after turn persistence (Recommended)
```typescript
import { logAuditEvent } from '@/lib/observability/index'

// After appendTurn calls:
void logAuditEvent({
  actorType: 'buyer',
  actorId: session.subjectId,
  agencyId: session.agencyId,
  action: 'conversation.voice_turn_completed',
})
```

**Effort:** Trivial | **Risk:** None

## Technical Details

**Affected files:**
- `src/app/api/conversation/realtime/persist/route.ts`

## Acceptance Criteria

- [ ] Each successful voice turn persist logs a `conversation.voice_turn_completed` audit event
- [ ] Audit failure does not block the response (use `void logAuditEvent(...)`)

## Work Log

- 2026-11-07: Identified during M5 review.
