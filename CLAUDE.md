@AGENTS.md

# Sandbox — working notes

Campus-only teammate finder. Next.js 16 + Tailwind v4 + Supabase. See README.md for setup.

## Design system (approved direction: calm & precise)

- All shared values live in `src/app/globals.css` (`:root` vars + `@theme inline`). Use the generated utilities (`bg-canvas`, `text-ink`, `text-muted`, `border-line`, `text-accent`, `text-body-sm`, `rounded-panel` …). No raw hex, no arbitrary `text-[..]`/`[..px]` values in components.
- One accent only: proof green (`accent`), for verified, links, match %, focus. Errors use `danger`.
- 1px borders separate regions; no heavy shadows, no gradients. Sections are split by rules, not wrapped in identical cards.
- Geist Sans for UI; Geist Mono only for evidence read from code (proof lines, match %).
- No all-caps eyebrow labels, no arrows appended to button text.
- Build pages from `src/components/ui/*` (Button/ButtonLink, Badge/VerifiedBadge, Panel, Container, Avatar, Alert, SkillProof, Spinner) and `src/components/site/*`.
- When `cn()` meets a new custom text size token, add it to the font-size group in `src/lib/cn.ts`.

## Data rules

- Every schema change is a new file in `supabase/migrations/`. Never edit an applied migration.
- Private student data (reg_no, ID photo path) stays in `student_verifications`; never add it to `profiles`.
- State changes with rules (review, respond/withdraw request, matching) go through the Postgres functions, not direct table updates from the app.
- GitHub repos/skills are written only by the server with the service role, from the student's own GitHub token.
