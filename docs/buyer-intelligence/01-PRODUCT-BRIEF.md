# 01 — Product brief and boundaries

## Positioning

**Working product name:** Buyer Intelligence (not necessarily the launch brand).  
**One-liner:** A conversational home brief that helps estate agents understand the person behind a search, recommend better-fit properties and prepare more useful viewings.  
**Buyer promise:** “Tell us what home means to you. We’ll use it to make your search more personal.”  
**Agency promise:** “Know your buyers beyond bedrooms and budget; turn preferences into useful conversations, viewings and eventually vendor opportunities.”

### Product hypotheses to validate

1. Voice-first (but never voice-only) discovery elicits richer buyer context than standard registration forms.
2. A concise, buyer-approved home brief is useful both to the buyer and the agent.
3. Evidence-backed matching and viewing preparation are valuable enough to change agent behavior and justify subscription spend.
4. Over time, **permissioned, aggregated** demand patterns can help agencies win relevant seller instructions.
5. Post-viewing feedback creates a learning loop that makes later recommendations and outreach more relevant.

The third hypothesis, **agent willingness to pay**, is the primary commercial risk. Do not let excitement about a technically compelling conversational demo obscure this.

## Who this serves

- **Invited buyer:** Wants to explain their priorities in their own words, not answer a long form; can start on mobile, skip questions and approve sharing.
- **Negotiator:** Wants essential details in 30 seconds, trustworthy property-fit analysis and an actionable viewing brief.
- **Agency owner/branch manager:** Wants better buyer service without replacing the existing CRM; eventually values evidence of active demand for winning instructions.
- **Future independent buyer:** Can claim, maintain and selectively share their home brief with multiple agencies and, separately, a discovery product such as Somewhere.

## Launch model: agency-led, portable by architecture

1. An agency creates a scoped invitation for a buyer, optionally pre-filling basic requirements.
2. Buyer uses a temporary invitation session; voice, text and visual cards all contribute to one structured profile.
3. Buyer reviews corrections and sharing scopes, then explicitly approves the brief for the inviting agency.
4. Agency receives only an approved version plus approved evidence; agent-specific notes/evaluations never flow into the reusable buyer profile.
5. Returning buyer access uses verified email/magic link (or equivalent authenticated proof). A permanent buyer-owned dashboard is deferred.
6. A later release offers buyer accounts and per-agency sharing, without changing the underlying ownership model.

**Data principle:** buyer preference data is not the same entity as an `agency_buyer`/applicant record. Consent to share with one agency is not consent to another, to Somewhere, or to marketing.

## Design personality

Warm off-white, muted sage and natural neutrals; DM Sans/Geist operational typography and Instrument Serif editorial moments. Spacious, approachable buyer surfaces; compact, legible agent surfaces. Purposeful layout transitions and inline expansion instead of repeated modal/dialog workflows. Reuse shadcn/ui and Tailwind; Motion for React sparingly. The supplied designs are the source of visual direction, not source code.

## MVP: the indispensable journey

| Capability | Demo MVP | Pilot-ready MVP | Future |
|---|---|---|---|
| Agency sign-in, invitations, status | ✅ | ✅ | — |
| Mobile invitation and buyer entry | ✅ | ✅ | — |
| Typed conversation, visual preference cards | ✅ | ✅ | — |
| Live conversational voice and fallback | ✅ | ✅ reliable | — |
| Preference extraction, confirmation and home brief | ✅ | ✅ | — |
| Versioned, permissioned agency share | ✅ | ✅ secure | — |
| Buyer intelligence, evidence, agency notes | ✅ | ✅ | — |
| Seeded/manual properties, explainable comparison | ✅ | ✅ | — |
| Editable viewing brief, copy/print | ✅ | ✅ | — |
| Post-viewing feedback link | — | Optional small pilot experiment | ✅ |
| Matched-property marketing outreach | — | — | ✅ |
| Aggregate demand insights for vendor prospecting | Design/seed exploration only | — | ✅ |
| Buyer-owned account and multi-agency sharing | Data architecture only | — | ✅ |
| Full CRM sync, listings ingestion, sales progression | — | — | Later/possibly never |

**Explicitly excluded from launch:** AI outbound calls, automatic viewing booking, listing scraping, unlimited consumer property search, mortgage/buying process, vendor lead generation via profiling individual sellers, unreviewed mass mailings and automatic resale of profile data.

## Jobs to be done

- **Before searching:** “Help me explain what matters without knowing property jargon.”
- **When registered:** “Give me an accurate home brief I can adjust and choose to share.”
- **Before a call:** “Tell me what's important, what’s uncertain and what not to waste their time with.”
- **Before a viewing:** “Explain why this particular home might work and what I must verify.”
- **After a viewing (extension):** “Capture what actually changed the buyer’s mind and improve future matches.”
- **Before pitching for a listing (extension):** “Show honest, non-identifying evidence of relevant active buyer demand.”

## Observable outcomes

Initial validation targets **(hypotheses, not researched benchmarks)**:

- At least 50% of buyers who begin onboarding submit a reviewed home brief.
- At least 80% of reviewed profiles rated useful by the participating negotiators.
- At least 60% of reviewed profiles reveal at least one material new preference relative to existing registration details.
- At least 50% of generated viewing briefs actually opened or consulted ahead of the viewing.
- At least one pilot agency offers to pay for continued usage, with stated price and buying decision-maker.

Record voice/text split, time-to-completion, correction frequency, agent time saved (self-reported and observational), matches rejected due to conflicts, and cost per completed profile. Avoid uploading transcripts into generic analytics.

## Pilot approach and commercial hypothesis

- Demo with one credible fictional agency (the provided Hartfield & Rowe), two buyers, two contrasting properties.
- Recruit 3–5 independent agencies for workflow interviews before complex integrations.
- Invite 10–20 real buyers through a single pilot agency, subject to clear information and proper controls.
- Test a willingness-to-pay band (e.g. £99–£199/branch/month plus a voice allowance); **pricing is a proposal, not a proven fact**.
- Measure actual usage and follow-up, not only demo feedback.

## Main value proposition and expansion tension

The app should be **more than an AI registration form**, because the agent gets usable outputs. But it must remain **less than a CRM**, because duplicating CRM responsibilities raises switching and selling costs. Demand intelligence is commercially intriguing but useful only once real, current, properly authorised buyer records exist at sufficient volume.
