---
status: complete
priority: p3
issue_id: "012"
tags: [code-review, architecture, quality]
dependencies: []
---

# 012 — extractAndPersist in features/preferences violates feature/lib boundary

## Problem Statement

`src/features/preferences/index.ts` now imports the Vercel AI SDK (`generateObject`, `zodSchema`, `ModelMessage`) and AI model configuration (`EXTRACTION_SYSTEM_PROMPT`, `getExtractionModel`). The `features/preferences` module is conceptually a data layer for preference storage. AI inference logic belongs in `lib/ai/` or a dedicated `features/extraction/` module. This boundary violation will make it harder to test, mock, and reason about the preferences feature in isolation.

## Findings

**`src/features/preferences/index.ts:1-5`** (after M5)
```typescript
import { z } from 'zod'
import { generateObject, zodSchema } from 'ai'
import type { ModelMessage } from 'ai'
import { getAdminClient } from '@/lib/supabase/admin'
import { EXTRACTION_SYSTEM_PROMPT, getExtractionModel } from '@/lib/ai/index'
```
AI SDK imported directly into a data-layer feature.

**Impact on testing:** Unit tests for preference schema/upsert now require mocking the AI SDK, even when testing pure preference DB operations.

## Proposed Solutions

### Option A: Move extractAndPersist to lib/ai/extraction.ts (Recommended)
Create `src/lib/ai/extraction.ts` with:
```typescript
export async function extractAndPersist(
  modelMessages: ModelMessage[],
  assistantText: string,
  versionId: string
): Promise<void>
```
Import `upsertPreferences` and `ExtractedPreferencesSchema` from `features/preferences` (data layer stays clean). Import AI utilities from `lib/ai/index`.

Both routes import from `lib/ai/extraction`.

**Pros:** Clean separation. `features/preferences` stays a pure data module. AI SDK mocking only needed in AI-layer tests.
**Cons:** New file. Import paths change in 2 route files.
**Effort:** Small | **Risk:** Low

### Option B: Accept current placement (Defer)
The boundary violation is mild. `extractAndPersist` is small and the coupling is pragmatic. Only revisit if testing complexity becomes a real issue.
**Effort:** None | **Risk:** Low

## Technical Details

**Affected files:**
- `src/features/preferences/index.ts` (remove AI imports + `extractAndPersist`)
- `src/lib/ai/extraction.ts` (new file)
- `src/app/api/conversation/route.ts` (update import)
- `src/app/api/conversation/realtime/persist/route.ts` (update import)

## Acceptance Criteria

- [ ] `features/preferences/index.ts` has no imports from `ai` package or `lib/ai`
- [ ] `extractAndPersist` lives in `lib/ai/extraction.ts` or similar
- [ ] All existing tests pass
- [ ] `pnpm typecheck` passes

## Work Log

- 2026-11-07: Identified during M5 architecture review.
