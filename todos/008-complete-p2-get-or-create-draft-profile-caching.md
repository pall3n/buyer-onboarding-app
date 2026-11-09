---
status: complete
priority: p2
issue_id: "008"
tags: [code-review, performance]
dependencies: []
---

# 008 — getOrCreateDraftProfile runs 2–5 DB queries on every conversation turn

## Problem Statement

Both the text conversation route and the voice persist route call `getOrCreateDraftProfile(session.subjectId)` on every single turn. This function performs 2–5 sequential DB queries (find profile, optionally insert, find draft version, optionally insert version). For a 20-turn conversation that mixes text and voice, this amounts to 40–100 extra DB queries for profile lookup alone.

## Findings

**`src/features/preferences/index.ts:79-141`** (`getOrCreateDraftProfile`)
Queries involved per call:
1. `SELECT id FROM home_profiles WHERE subject_id = ?`
2. (If not found) `INSERT INTO home_profiles`
3. `SELECT id FROM home_profile_versions WHERE profile_id = ? AND status = 'draft'`
4. (If not found) `SELECT MAX(version_number) FROM home_profile_versions`
5. (If not found) `INSERT INTO home_profile_versions`

**Called from:**
- `src/app/api/conversation/route.ts:47` — every text turn
- `src/app/api/conversation/realtime/persist/route.ts:18` — every voice turn
- `src/app/brief/[opaqueId]/conversation/page.tsx:25` — page load
- `src/app/api/conversation/route.ts:109` — brief refresh GET

## Proposed Solutions

### Option A: Store versionId in the buyer session cookie (Recommended)
After first creation, store `versionId` in the `buyer_sessions` table as a denormalised column. On subsequent calls, read it from the session row that is already fetched during auth validation.

```typescript
// In requireBuyerSessionForRoute, also return versionId if present
// In getOrCreateDraftProfile, upsert and store result back to session
```
**Pros:** Eliminates the profile/version lookup on hot path. Session query is already happening.
**Cons:** Schema change needed. Need to handle the case where versionId is null (first turn).
**Effort:** Medium | **Risk:** Low

### Option B: Next.js cache() or unstable_cache for server-side memoisation
Wrap `getOrCreateDraftProfile` with `React.cache()` (Next.js request-scoped) so it's called once per request regardless of how many times the function is invoked in the same request chain.

```typescript
import { cache } from 'react'
export const getOrCreateDraftProfile = cache(async (subjectId: string) => { ... })
```
**Pros:** Zero schema change. Works immediately.
**Cons:** Only caches within a single request — doesn't help across requests (each turn is a separate request).
**Effort:** Trivial | **Risk:** None

### Option C: Accept current behaviour for MVP
Profile/version already exist after the first turn. Queries 1 and 3 are fast index-lookups. 2–3 queries per turn is acceptable until traffic justifies optimisation.
**Effort:** None | **Risk:** Low

## Technical Details

**Affected files:**
- `src/features/preferences/index.ts`
- `src/app/api/conversation/route.ts`
- `src/app/api/conversation/realtime/persist/route.ts`

## Acceptance Criteria

- [ ] The number of DB queries per turn for profile lookup is reduced to ≤1 on the hot path
- [ ] First-turn profile creation still works correctly

## Work Log

- 2026-11-07: Identified during M5 performance review.
