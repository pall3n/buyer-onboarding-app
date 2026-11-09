---
status: complete
priority: p2
issue_id: "003"
tags: [code-review, security, quality]
dependencies: []
---

# 003 — requireAgentAuth throws 500 instead of redirecting on missing membership

## Problem Statement

`requireAgentAuth()` redirects to sign-in when there's no authenticated Supabase user, but **throws an unhandled exception** when a user is authenticated but has no active agency membership. This surfaces as a 500 error page rather than a clean redirect, exposing an error boundary to the user and leaking implementation details.

## Findings

**`src/lib/auth/index.ts:35-37`**
```typescript
if (!membership) {
  throw new Error('No active agency membership for user')
}
```
An authenticated Supabase user with no agency membership (e.g., deleted membership, wrong tenant, test user) hits this throw. Next.js turns it into a 500. The user sees an error page with no recovery path.

**Compare with the successful path:**
```typescript
if (!user) {
  redirect('/auth/sign-in')  // ← clean redirect
}
```
The pattern is inconsistent.

## Proposed Solutions

### Option A: Redirect to sign-in with error param (Recommended)
```typescript
if (!membership) {
  redirect('/auth/sign-in?error=no_membership')
}
```
**Pros:** Consistent with how missing user is handled. User gets a recoverable state.
**Cons:** None.
**Effort:** Trivial | **Risk:** None

### Option B: Dedicated error page
Redirect to a `/auth/error` page with a friendly "account not set up" message.
**Effort:** Small | **Risk:** Low

## Technical Details

**Affected files:**
- `src/lib/auth/index.ts:35-37`

## Acceptance Criteria

- [ ] An authenticated user with no agency membership is redirected (not 500'd)
- [ ] The redirect target gives a recoverable UX state
- [ ] Error is logged server-side before redirecting

## Work Log

- 2026-11-07: Identified during auth layer review.
