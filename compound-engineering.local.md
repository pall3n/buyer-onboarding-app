---
review_agents:
  - compound-engineering:review:security-sentinel
  - compound-engineering:review:architecture-strategist
  - compound-engineering:review:performance-oracle
  - compound-engineering:review:kieran-typescript-reviewer
  - compound-engineering:review:code-simplicity-reviewer
---

# Project: Buyer Intelligence — buyer-onboard-app

Next.js 16 App Router SaaS for estate agencies. Buyers complete a voice/text conversation that extracts home preferences into a structured profile. Agents view buyer briefs and property fit scores.

## Tech Stack
- Next.js 16 (App Router, React 19, TypeScript)
- Supabase (Postgres + RLS + Auth)
- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`)
- OpenAI Realtime API (WebRTC, ephemeral tokens)
- Tailwind v4, Motion for React, Zod, Vitest

## Review Focus Areas
- Security: ephemeral token issuance, session validation, RLS bypasses, server-action auth
- Architecture: data boundary between buyer-owned and agency-owned records, voice+text modality separation
- TypeScript quality: strict types on AI SDK types, hook cleanup patterns
- Performance: streaming, WebRTC lifecycle, AudioContext cleanup
