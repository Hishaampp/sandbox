@AGENTS.md

# Sandbox — working notes

Campus-only teammate finder. Next.js 16 + Tailwind v4 + Supabase. See README.md for setup.

## Design system (founder palette: Navy #14213D, Cream #F4EDE0, Coral #FF6B5B)

DESIGN.md is the full record; PRODUCT.md holds product truth; the landing direction contract lives in `.impeccable/surfaces/`. In short:

- All shared values live in `src/app/globals.css` (`:root` vars + `@theme inline`). Use the generated utilities (`bg-canvas`, `text-ink`, `text-muted`, `border-line`, `bg-action`, `text-accent`, `text-body-sm`, `rounded-panel` …). No raw hex, no arbitrary `text-[..]`/`[..px]` values in components.
- Two scopes, same token names: day (cream ground, navy ink; the signed-in app) and night (navy ground, cream ink; `.theme-night`, used by the public hero/header/footer/sign-in, and by dark mode everywhere). Put night sections on `.night-field` (`-left` / `-low` variants move the single coral light).
- Coral is a fill, glow and action colour (`bg-action` with `text-action-ink`), never text on cream (2.4:1). Text accents on cream use `text-accent` (deep coral #B8392A, 4.9:1).
- Never describe unbuilt features as live: mark them "Coming next" / "Planned" until they ship.
- 1px borders separate regions; no gradients except the night field's light; no feature-card icon tiles. Sections are split by rules.
- Bricolage Grotesque (`font-display`) for large headings, Geist for UI, Geist Mono only for evidence read from code (proof lines, match %, repo names).
- Motion: one authored moment per surface (the landing match card + commit cells); elsewhere only feedback. Every animation class needs a `prefers-reduced-motion` path in globals.css.
- No all-caps eyebrow labels, no arrows appended to button text.
- Build pages from `src/components/ui/*` (Button/ButtonLink, Badge/VerifiedBadge, Panel, Container, Avatar, Alert, Field/Input/Select/Textarea, ImageInput, SkillProof, Spinner) and `src/components/site/*`.
- When `cn()` meets a new custom text size or font token, add it to its group in `src/lib/cn.ts`.
- If styles look stale in dev, stop the server and delete `.next` (Turbopack's cache once served old CSS).

## Data rules

- Every schema change is a new file in `supabase/migrations/`. Never edit an applied migration.
- Private student data (reg_no, ID photo path) stays in `student_verifications`; never add it to `profiles`.
- State changes with rules (review, respond/withdraw request, matching) go through the Postgres functions, not direct table updates from the app.
- GitHub repos/skills are written only by the server with the service role, from the student's own GitHub token.
