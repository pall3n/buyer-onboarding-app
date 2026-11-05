# 02 — Design implementation brief

**Design reference:** The nine supplied Claude Design PNGs and associated HTML preview. **These are visual and interaction references, not code to reuse.** Where an interaction only appears as a control, its intended behavior below is proposed and must be implemented; do not assume the preview does it.

## Screen-by-screen reference inventory

| Screen | Reference | Observed in supplied design | Required build behavior |
|---|---|---|---|
| A — Agent workspace | `reference/screens/05.png` | Hartfield & Rowe navigation; Sophie Lane; invitation CTA/embedded invite form; two completed buyers; evaluations; next-up and open questions; empty state | Agent auth, invitation creation, searchable buyer list, link to profiles/evaluations; empty/populated states and meaningful actions |
| B — Buyer invitation (mobile) | `reference/screens/00.png` | Personal invitation from Sophie to Maya, agency brand, voice vs type choice, ~5 minute promise, pause, approval/privacy copy | Validate scoped invitation, display actual agency and invite details, start voice/text, privacy disclosure, skip route |
| C — Conversation (desktop) | `reference/screens/01.png` | Spacious thread; contextual location/garden/renovation/trade-off cards; compact input dock; right-side “Your brief is taking shape” | Session state persists, adaptive questions, typed/voice turns, visual answers, extracted candidate summary with no pre-share agent access |
| C — Conversation (voice/mobile) | `reference/screens/02.png` | Listening orb, “things noted”, spoken transcript, inline location cards, bottom voice dock | Live voice session, captions, accessible alternatives, switch modes and recover state |
| D — My home brief (mobile) | `reference/screens/03.png` | Editorial “Maya and James’s next home”, non-negotiables, nice-to-haves, lifestyle, taste, renovation, compromises, selected sharing | Confirm/edit every preference, preview scopes, approve profile version, return access; never imply unsaved edits are shared |
| States and patterns | `reference/screens/04.png` | Voice idle/listening/thinking/speaking/blocked; dropped connection; generating/retry; paused resume; trust indicator legend | Implement complete state machine, inline recovery, status by text+icon not color alone |
| E — Agent buyer profile | `reference/screens/06.png` | Approved summary, five quick facts, top priorities/dealbreakers, source excerpts, lifestyle, taste, renovation, trade-offs, clarifying questions, sidebar agency notes | Evidence accordions, private notes, confirmed vs inferred, property evaluation CTA, access control |
| F — Property fit | `reference/screens/07.png` | Side-by-side properties, grounded source tags, strong matches/compromises/conflicts/unknowns, “worth asking”, create brief | Deterministic hard rules, explainable soft comparison, version source and source freshness, safe send action (later) |
| G — Personalised viewing brief | `reference/screens/08.png` | Elegant printable paper sheet; priorities, 3 viewing highlights, verified local context, objections/checks, agent notes, copy/print/PDF/share controls | Editable, evidence-backed draft; copy and print in MVP; PDF/share only if actually implemented |

### What is distinctive in this design

- Voice *and* typing in **one morphing composer** rather than separate funnels.
- A second-column **live emerging home brief** on desktop.
- Visual choices embedded **in the conversation context**, not in a fixed survey.
- Buyer brief that feels like an **editorial deliverable** rather than a CRM contact record.
- Agent view that is **information-rich but not visually noisy**; expandable conversation evidence.
- Fit explanations split into **strong matches, potential compromises, conflicts, unknowns**.
- The printable viewing brief uses carefully composed **serif display typography**, restrained warm callouts and evidence markers.
- Clear trust states: **Confirmed / Suggested / Unknown / Conflict**.

## Visual system to preserve

### Proposed implementation tokens (sample, not measured exact values)

```css
:root {
  --bi-background: #faf9f5; /* close to supplied preview */
  --bi-surface: #ffffff;
  --bi-surface-soft: #f0f1eb;
  --bi-ink: #202923;
  --bi-muted: #69736b;
  --bi-line: #e3e7e0;
  --bi-sage: #607b6b;
  --bi-sage-pale: #e7eee8;
  --bi-apricot: #f2e6d8;
  --bi-blue-pale: #e4edf0;
  --bi-danger: #a44c3b;
}
```

Use CSS custom properties bridged to **shadcn semantic tokens**, not scattered hex values. Both themes can be planned, but the provided reference is **light mode**; build that first. Body type: **DM Sans or Geist**. Editorial heading: **Instrument Serif** on buyer-facing hero and viewing pack. Use supplied Google-font family names, not extracted font binaries. System fallback required.

- Density: agent screens moderately compact, buyer screens generous and easy to tap.
- App background: warm off-white; white content surfaces; pale sage and terracotta used sparingly.
- Border: low contrast 1px; corners medium/large; shadow minimal.
- Typography: muted eyebrow labels, strong title hierarchy, readable body copy, serif only for suitable moments.
- Photos: real property imagery eventually; **abstract illustrations in the mockup are placeholders**, not verified listings. Use descriptive image alt text and stable aspect ratios.
- Status never depends on colour alone; display words/icons and evidence sources.

## Layout patterns

### Buyer invitation and review: mobile first

- Narrow reading column around 400–640 CSS px on wide screens; full bleed with safe padding on mobile.
- Strong opening message from a real agency representative; optional logo and personal note.
- Voice and type are equal choices; no voice-preference dark pattern.
- Sticky action area when needed, above safe-area inset; keyboard/focus must remain usable.
- Readable home brief as long-form vertical content, with inline editors.

### Desktop conversation

- Primary conversation column max-width around 720–860px.
- Optional right rail (~280–360px) shows progress and tentative preferences, **private until approval**.
- Conversation header is quiet (agency name, pause/save, brief toggle).
- Input dock stays visible, but never obscures active question cards.
- On tablet/mobile, right rail becomes a collapsible “Noted so far” sheet/inline section.

### Agent workspace

- Left sidebar for Buyers / Properties / Settings; collapses on smaller widths.
- Dashboard includes “ready to read,” evaluations, next actions and an empty state. Do not invent analytics vanity charts.
- Agent profile uses wide content with a narrow right rail for questions/changes/agency notes.
- Long evidence is revealed inline with `Accordion`/`Collapsible`; no forced modal opening for each preference.

### Fit comparison

- On desktop, property summary card column + substantial comparison column.
- On mobile, property card above explanation groups; navigation for switching properties remains accessible.
- Conflicts appear before or at least equally prominent to favorable conclusions; no invented “82% fit” precision.

### Viewing pack

- White A4-like paper surface on neutral canvas, with an explicit `@media print` stylesheet.
- No decorative navigation in print; preserve source/verified labels and page-break control.
- Private agent notes should not automatically be included in a buyer-shareable variant.

## Motion principles (Motion for React)

| Interaction | Proposed behavior | Requirement |
|---|---|---|
| Voice dock | Type input morphs to listening/thinking/speaking dock, controls move by shared layout | Focus preserved; reduce motion variant |
| Visual answer cards | Enter within thread; on selection, collapse to a small response line and continue | Preserve response/edit ability; keyboard support |
| “Noted so far” | Candidate fact appears gently in sidebar/inline summary | Must not imply buyer-confirmed fact |
| Conversation → brief | Transition via shared header and summary content | Avoid complex cross-route animation if it risks state loss |
| Profile evidence | Expand source excerpt within original row | No unsolicited scrolling or focus loss |
| Fit → viewing pack | Selected analysis informs document-like draft | Data, not motion, is the source of truth |

Aim for 160–300ms small transitions; use a soft spring only where it helps. Respect `prefers-reduced-motion`. **Never animate essential text away during a save or error.**

## shadcn/ui component mapping

- `Button`, `Input`, `Textarea`, `Label`, `Separator` — baseline controls.
- `Card` as appropriate, not nested indiscriminately.
- `Badge` — values such as Confirmed/Suggested/Unknown with clear label and icon.
- `Accordion` or `Collapsible` — source evidence, lifestyle items, agent clarifications.
- `RadioGroup` and custom `ToggleGroup`/buttons — preferences, priority selection; custom visual cards must have proper selected states and labels.
- `Tabs` — multiple property comparisons; avoid complex carousel if tabs are clearer.
- `Sheet` — compact right rail on mobile, notes/share preview; not as the default for every action.
- `Tooltip`/`Popover` — supplementary explanations only, never sole access to essential information.
- `Toast`/`Sonner` — invitation copied, saved, nonblocking errors; errors requiring action must remain in view.
- `Skeleton` and `Progress` — generation/loading and conversational progress, without fake exact timing.
- `DropdownMenu` — secondary controls; keep primary actions visible.
- `AlertDialog` — destructive revocation/deletion only, not ordinary editing.

### Suggested feature components

`AgencyShell`, `InviteBuyerPanel`, `BuyerInvitation`, `ConversationThread`, `ConversationMessage`, `VoiceComposer`, `AudioOrb`, `VisualChoiceGrid`, `RenovationPicker`, `TradeoffSelector`, `EmergingBrief`, `PreferenceEditor`, `HomeBriefSummary`, `SharingReview`, `TrustStatus`, `EvidenceDisclosure`, `AgencyBuyerProfile`, `PropertyFactCard`, `FitBreakdown`, `ViewingBriefDocument`, `PrintToolbar`.

## Navigation routes (proposed)

```text
/(agency)/buyers
/(agency)/buyers/[agencyBuyerId]
/(agency)/buyers/[agencyBuyerId]/matches/[propertyId]
/(agency)/viewing-briefs/[briefId]
/(agency)/properties
/invite/[token]
/brief/[sessionId]/conversation   (secure opaque access; never sessionId alone as credential)
/brief/[sessionId]/review
/brief/[sessionId]/shared
```

Path naming is not an auth boundary. Scope by actor and grant on **every server query**.

## Missing design states to create before pilot

1. Invalid/expired invitation, inviter revocation and re-invite.
2. Microphone permission denied, muted device, network drop, no audio output, voice quota exhausted, switch to text.
3. Partially finished conversation with safe resume; different-user access denied.
4. Empty/no-evidence preference, stale suggestion, duplicate or contradictory answers.
5. Editing a confirmed preference and clear “Draft changes not shared yet” banner.
6. Sharing selection/confirmation and revocation, with precise consequences.
7. No property selected, property missing a field, ambiguous area facts, no matches and hard-conflict property.
8. Printable/exported pack vs private agency-only pack.
9. Loading/retry for extraction, property analysis and print generation.
10. Small mobile adaptation for agent screens, accessible focus/keyboard layouts.

## Known issues in the supplied concept to resolve deliberately

- Conversation design says **“Anything left unselected is treated as ‘rather not’”** for renovation, which would turn skipped/unknown into a negative. **Change: unselected = unknown** unless buyer explicitly chooses “not for me”.
- Invitation says **“Recordings are transcribed, then deleted”**. That claim is permissible only if the production pipeline demonstrably does so and its transcript retention policy is disclosed. Do not retain raw audio by default.
- Buyer brief suggests **“You can edit or withdraw this any time”**. Explain withdrawal as **future access termination**, not guaranteed deletion of previously accessed records or lawful agency-retained material.
- Agent profile notes that **“one item ... wasn’t shared”**. This leaks metadata about a private omission. Do not reveal existence or count of unshared preferences.
- Prototype includes email/send/share/PDF controls; unless implemented, they must not appear as functional production controls. Implement copy and print first, and require permissions + user confirmation for sending.
- Demo contains precise local walk times and verified footpaths (e.g. 17-minute walk / walked by Sophie). These are **fictional demonstrator facts**; do not represent them as verified for real places.
- Some buyer facts are “Suggested” but summary language can sound certain. Render confirmed statements clearly, and phrase unconfirmed interpretations as suggestions.

## Accessibility and UX acceptance

- Complete text-only path to the same profile, all answer cards operable by keyboard and screen reader.
- 44px-ish tap targets where practical; visible selected/focus states; error messages announced via appropriate live regions.
- Captions readable and not dependent on audio; voice cannot be the only way to complete any step.
- All transient “saved” feedback is backed by a successful persistence response, not optimistic animation alone.
- Preserve user-entered draft if extraction or the network fails.
- AI never makes destructive or external-send decisions just because an animation completes.

## Fidelity rule for coding agents

Match **layout hierarchy, surfaces, proportions, type feel, information density and interaction intent** before micro-polish. Keep features real and accessible. A visually exact fake button is worse than a slightly different working control. Do not ingest the HTML prototype into source files or blindly transplant scripts, CSS blobs, placeholder claims or dummy data.
