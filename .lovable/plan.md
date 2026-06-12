# Audit & Premium Design Upgrade

A design + UX pass only. Zero changes to data, routes, Supabase, Gemini, or business logic.

## Audit

### What already exists (and works)
- **Branding & tokens** in `src/styles.css`: navy / ivory / aqua palette, `.surface-navy`, `.surface-navy-grid`, `.card-soft`, `.card-navy`, `.eyebrow`, `.text-glow*`. Cormorant + Inter + JetBrains Mono.
- **Landing** (`src/routes/index.tsx`) — already premium-ish (hero glow, stats strip, navy grid). Mostly polish.
- **AppShell** (`src/components/AppShell.tsx`) — navy sidebar, role-aware nav, notifications, sign-out, `PageHeader`.
- **Student routes**: dashboard, startup, proposal, mentor, checklist, mvp, demo-day, **ai** (Pitch Check), notifications.
- **Admin routes**: overview, startups, proposals, mentors, stories, users.
- **AI Pitch Check** (`src/routes/app.ai.tsx`) — fully functional Gemini evaluation, scores object, strengths/weaknesses/risks/improvements/next_steps, history. Visuals are basic.
- **Auth + RLS + role gating** all in place.

### Partially implemented
- Animations: only Tailwind `animate-pulse` on Skeleton; no entrance/scroll/stagger anywhere.
- Empty states: present but plain.
- Sidebar active state: works but flat (no indicator bar, no hover lift).
- AI page: layout is a generic 3-col grid, not the editorial "Pitch Readiness Checker" hero the user wants.

### Missing
- `framer-motion` package.
- Reusable motion primitives (`FadeIn`, `Stagger`, `Reveal`).
- Premium AI hero (editorial left column + dark glass evaluation card on right + animated bars).
- Loading skeletons on most routes.
- Page transitions.

### Affected by the redesign
- `src/styles.css` — additive utilities only (no token changes).
- `src/components/AppShell.tsx` — sidebar polish, header polish, `PageHeader` enhancement.
- `src/routes/app.ai.tsx` — significant visual restructure (logic untouched).
- `src/routes/app.index.tsx` — dashboard hero + stat polish.
- `src/routes/admin.index.tsx` — stat panel polish.
- Other route files — light wrap in motion primitive + skeleton swap. No behavior changes.

### Risks & mitigations
- **Risk**: motion library bloats bundle. **Mitigation**: import `motion/react` (Motion v12, lightweight) only where used.
- **Risk**: regressions in AI page wiring. **Mitigation**: keep `useQuery`, `supabase.functions.invoke`, insert, and feedback shape **byte-identical** — only JSX/layout changes.
- **Risk**: sidebar active-state regex change breaks routing highlight. **Mitigation**: keep current `location.pathname` logic; only add visual layers (indicator bar, transition classes).
- **Risk**: token drift. **Mitigation**: only **add** CSS utilities (`.glass`, `.shadow-premium`, `.bar-aqua`, `.chip`); never modify existing tokens.

### Reversibility
All changes are isolated to the files listed above. Reverting any single file restores prior visual state without affecting logic. No DB migrations, no route additions, no dependency removals.

## Implementation

### 1. Foundations
- `bun add motion` (Motion v12 = framer-motion successor, smaller).
- Add to `src/styles.css` (additive):
  - `.glass` — backdrop-blur + subtle border (using `backdrop-filter` only per tailwind4-gotchas).
  - `.shadow-premium` — layered soft shadow.
  - `.bar-track` / `.bar-fill` — gradient aqua progress with glow.
  - `.chip` — animated category chip.
  - `.hover-lift` — translate + shadow on hover.
  - `@keyframes shimmer`, `@keyframes gradient-shift`.
- Create `src/components/motion.tsx` exporting `FadeIn`, `Stagger`, `StaggerItem`, `Reveal` (scroll-triggered).

### 2. AppShell polish
- Sidebar: add left aqua indicator bar on active link, smooth `transition-all`, hover translate-x, gradient on active.
- Header: thin gradient bottom border, breadcrumb-style label.
- `PageHeader`: larger display type, eyebrow chip, fade-in on mount.

### 3. AI Pitch Check (centerpiece)
Structural changes only — query, mutation, and feedback rendering stay identical.
- New top section: 12-col grid.
  - **Left 6**: editorial display
    - "Pitch \n Readiness \n Checker." with "Readiness" in italic aqua + `.text-glow`.
    - Supporting paragraph (existing copy, restyled).
    - Animated chip cloud of the 7 categories (Team Readiness, Market Potential, Innovation, Business Clarity, Solution Strength, Problem Definition, Business Model) — hover lift + aqua border.
    - Run button (existing handler).
  - **Right 6**: dark navy gradient `.card-navy` + `.glass`
    - "Pitch Ready" badge (conditional on overall_score ≥ 70).
    - Huge overall score with animated count-up.
    - 7 animated `.bar-fill` rows (one per score key), staggered entrance, gradient aqua fill, soft glow.
- Below: 5 analysis panels (Strengths / Weaknesses / Risks / Improvements / Next Steps) — each its own treatment:
  - Strengths: aqua accent
  - Weaknesses: amber accent
  - Risks: rose accent
  - Improvements: ivory neutral
  - Next Steps: numbered timeline column
- History list: keep, restyle as soft rows with delta arrows.
- Empty state: editorial card replacing the current placeholder.

### 4. Dashboard polish (`app.index.tsx`)
- Welcome hero row with greeting + status badges.
- Stat tiles with `.hover-lift` and stagger entrance.
- Progress card: gradient bar, ring around %.
- Side cards keep content, gain `.glass` on AI tile only.

### 5. Admin overview polish
- Same stat-tile treatment; add subtle gradient backgrounds keyed by metric.

### 6. Light touch on other routes
- Wrap top-level content in `<FadeIn>` so navigation feels smooth.
- Swap any `Loading…` text for `Skeleton` blocks.

## Files changed (final list, all reversible)
- `package.json` / `bun.lock` — add `motion`
- `src/styles.css` — additive utilities + keyframes
- `src/components/motion.tsx` — **new**
- `src/components/AppShell.tsx` — sidebar/header/PageHeader visuals
- `src/routes/app.ai.tsx` — layout redesign (logic preserved)
- `src/routes/app.index.tsx` — dashboard visuals
- `src/routes/admin.index.tsx` — stat visuals
- `src/routes/{app.startup,app.proposal,app.mentor,app.checklist,app.mvp,app.demo-day,app.notifications,admin.*}.tsx` — FadeIn wrap + skeleton only

## Out of scope (explicitly NOT changed)
- Color palette tokens, route tree, Supabase schema/RLS, `evaluate-pitch` edge function, auth flow, role logic, feedback shape, queries, mutations.

Approve to proceed.
