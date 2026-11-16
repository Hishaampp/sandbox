---
name: Sandbox
description: Find teammates by what they've built, not what they claim.
colors:
  navy: "#14213d"
  navy-deep: "#0e1830"
  cream: "#f4ede0"
  coral: "#ff6b5b"
  coral-hover: "#ff8577"
  deep-coral: "#b8392a"
  coral-tint: "#fbe2dc"
  paper: "#fbf8f2"
  sunken: "#ebe3d4"
  ink-soft: "#2e3a55"
  muted: "#5b6478"
  line: "#ded4c2"
  line-strong: "#c9bda8"
  danger: "#a3261b"
  danger-soft: "#f8ddd8"
  night-ink-soft: "#dcd3c3"
  night-muted: "#a9b0bf"
  night-accent: "#ff8a7c"
typography:
  display-lg:
    fontFamily: "Bricolage Grotesque, Geist, ui-sans-serif, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 600
    lineHeight: "4.625rem"
    letterSpacing: "-0.04em"
  display:
    fontFamily: "Bricolage Grotesque, Geist, ui-sans-serif, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: "3.75rem"
    letterSpacing: "-0.035em"
  display-sm:
    fontFamily: "Bricolage Grotesque, Geist, ui-sans-serif, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: "2.875rem"
    letterSpacing: "-0.03em"
  heading:
    fontFamily: "Bricolage Grotesque, Geist, ui-sans-serif, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: "2.5rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: "1.875rem"
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: "1.875rem"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.625rem"
    fontFeature: "\"ss01\", \"cv11\""
  body-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: "1.5rem"
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  proof:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
rounded:
  cell: "3px"
  control: "6px"
  panel: "12px"
  full: "9999px"
spacing:
  gutter-phone: "20px"
  gutter-md: "32px"
  gutter-xl: "48px"
  panel-pad: "20px"
  panel-pad-app: "24px"
  section-y: "80px"
  section-y-md: "112px"
  page-max: "88rem"
  prose-max: "40rem"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    typography: "{typography.label}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.coral-hover}"
    textColor: "{colors.navy}"
  button-primary-lg:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-secondary-hover:
    backgroundColor: "{colors.sunken}"
  button-ghost:
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  badge-neutral:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.full}"
    typography: "{typography.caption}"
    height: "24px"
    padding: "0 10px"
  badge-solid:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.cream}"
    rounded: "{rounded.full}"
    height: "24px"
    padding: "0 10px"
  badge-accent:
    backgroundColor: "{colors.coral-tint}"
    textColor: "{colors.deep-coral}"
    rounded: "{rounded.full}"
    height: "24px"
    padding: "0 10px"
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    height: "24px"
    padding: "0 10px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    typography: "{typography.body-sm}"
    height: "40px"
    padding: "0 12px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
---

# Design System: Sandbox

## Overview

**Creative North Star: "The Build Night"**

Sandbox is a campus after hours: a navy field where real activity glows. The public site lives at night (navy deepening to navy-deep, one coral light source, a faint commit-graph grid of rounded squares with a few cells lit), and the signed-in app lives in the calm of day (cream ground, navy ink, coral reserved for the action). Dark mode carries the night values into the app. The two scopes are one token set, swapped by `.theme-night` or `prefers-color-scheme: dark`, so every component works in both without its own variant.

The system is flat and ruled. Depth comes from tone (paper over cream, sunken fills) and from 1px lines, never from elevation shadows. On the night field, panels become frosted glass: translucent cream at low alpha with a cream hairline and a backdrop blur. Proof is the product, so evidence read from code is set in Geist Mono and everything self-claimed is visibly quieter.

Density is generous on the public site (80 to 112px section rhythm, display type up to 72px) and moderate in the app (24px panel padding, a single heading per page). Motion is a confident deceleration that tells the matching story once, then stops.

**Key Characteristics:**
- Founder-pinned palette: Navy, Cream, Coral; nothing else carries hue except the danger pair.
- Two scopes, one token set: day (cream) for the app, night (navy field) for the public site, header, footer, sign-in and dark mode.
- Coral is fill, glow and action; it never sets text on cream.
- Flat surfaces separated by 1px rules; the only box-shadow is a lit commit cell's glow.
- Mono type means "read from code"; italic muted means "self-added".

## Colors

A three-colour founder palette, navy and cream trading ground and ink, coral as the single light source.

### Primary
- **Build-Night Coral** (`coral`): the one action colour. Primary button fill with navy text (5.7:1), the logo's inner block, lit commit cells, and the radial glow on the night field. Hover lifts to Coral Hover (`coral-hover`).
- **Deep Coral** (`deep-coral`): coral's text voice on cream (4.9:1). Links, done-state checks, focus rings, caret, accent badges. On the night scope the accent becomes Night Coral (`night-accent`).

### Neutral
- **Campus Navy** (`navy`): ink on cream (13.7:1), the sticky public header, the solid badge, and the top of the night gradient. Dark-mode panels.
- **Midnight Navy** (`navy-deep`): the night canvas and the bottom of the night gradient.
- **Notebook Cream** (`cream`): the day canvas and the night ink.
- **Paper** (`paper`): raised surfaces in day (panels, inputs, menus). On the night field paper becomes cream at 6% alpha (glass).
- **Sunken Cream** (`sunken`): quiet fills, skeletons, hover rows, the "Best matches" band.
- **Soft Ink** (`ink-soft`) and **Slate Muted** (`muted`): long-form copy and secondary text. Night equivalents: `night-ink-soft`, `night-muted`.
- **Rule Sand** (`line`) and **Strong Rule** (`line-strong`): 1px borders and dividers; input and secondary-button borders use the strong rule. On night, lines are cream at 14% and 24%.
- **Danger** (`danger`, `danger-soft`): rejected verification and form errors only, always with an icon or text.

### Named Rules
**The Coral Never Writes On Cream Rule.** Coral on cream measures 2.4:1. Coral may fill, glow or mark, but any coral-family text on a cream or paper ground uses Deep Coral (4.9:1).

**The One Light Source Rule.** Each night section has exactly one coral bloom, repositioned per section (lower right in the hero, lower left in proof, low centre at the close) so it never reads as a stamp.

**The Token-Only Rule.** Components use the semantic utilities (canvas, paper, sunken, ink, muted, line, action, accent), never raw hex, so the day and night scopes swap cleanly.

## Typography

**Display Font:** Bricolage Grotesque (opsz and wdth axes), falling back to Geist
**Body Font:** Geist (with ui-sans-serif, system-ui), stylistic sets ss01 and cv11 on
**Label/Mono Font:** Geist Mono, for proof only

**Character:** Bricolage gives the big night headlines a built, slightly wide voice; Geist keeps the app plain and readable; Geist Mono is the voice of evidence.

### Hierarchy
- **Display** (600, 40px on phones, 56px from md, 72px from xl, tight negative tracking): the hero and closing headlines on the night field, balanced. One per section at most.
- **Heading** (600, 32px/40px, -0.02em, Bricolage): landing section titles and the single page title in the app (Dashboard, Verification queue).
- **Title** (600, 22px/30px, -0.01em, Geist): panel and card titles; the sign-in card title uses Bricolage at this size.
- **Lead** (400, 19px/30px): the one intro line under a display or heading, in muted, max 40rem.
- **Body / Body-sm** (400, 16px/26px and 15px/24px): copy, table cells, nav links, inputs.
- **Label** (500, body-sm): buttons, field labels, list-row names.
- **Caption** (400, 13px/20px): meta lines, panel labels in sentence case, figcaptions, badges.
- **Proof** (Geist Mono, caption size): evidence lines, repository names, match percentages (tabular).

### Named Rules
**The Mono Means Proof Rule.** Geist Mono appears only on evidence read from code (repo names, proof lines, the match score). Self-added skills are muted italic Geist, never mono.

**The Sentence-Case Label Rule.** Panel labels ("Your idea", "Repositories read") are muted caption in sentence case. No uppercase tracked labels.

## Layout

One left edge: a centred container up to 88rem with 20px gutters on phones, 32px from md and 48px from xl. Prose and intros cap at 40rem.

Landing sections stack with 80px vertical padding (112px from md), separated by a 1px top rule on day or by switching to the night field. Two section layouts recur: **stack** (heading, then 48 to 64px, then full-width content) and **split** (from lg, a 12-column grid with the heading sticky in the left 4 columns and content in the right 8). The hero is a two-column grid from lg (64px gap, 96px at xl).

Tables and lists are ruled, not carded: a 1px navy top rule, then rows divided by 1px lines with 16px vertical padding; on phones each row stacks and its column labels become visible inline.

The app uses the same container, a 64px header, one heading, and a main column with a narrower side column of panels.

## Elevation & Depth

Flat by default. Day surfaces separate by tone (paper on cream, sunken bands) and 1px lines. Night surfaces are frosted glass: cream at 6% alpha, a cream hairline at 14%, and a strong backdrop blur over the gradient and grid. The night field itself is the depth: a vertical navy to navy-deep gradient, a coral radial bloom at 50% alpha with a 14% halo, and the commit-graph grid masked to fade at the edges.

### Shadow Vocabulary
- **Lit cell glow** (`box-shadow: 0 0 14px 1px rgb(255 107 91 / 0.4)`): only on the brightest commit cells. It is light, not elevation.

### Named Rules
**The No-Lift Rule.** Panels, menus, buttons and inputs carry no box-shadow. A dropdown separates by paper fill and a 1px line; glass separates by blur.

## Shapes

Two radii do the work: a gentle control radius (6px) for buttons, inputs, alerts, focus outlines and nav targets, and a panel radius (12px) for panels and menus. Pills (full) are reserved for badges, avatars and step numbers. The commit cell is a small rounded square (3px), the system's recurring geometry: it tiles the night grid, lights up in activity strips, and echoes in the logo's inner block.

## Components

### Buttons
Confident and quiet; one coral button per view.
- **Shape:** gently rounded (6px), three heights: 32px (caption), 40px (body-sm), 48px (body).
- **Primary:** coral fill, navy label, medium weight. The Google sign-in is the primary on public surfaces.
- **Hover / Focus / Active:** hover to coral-hover over 150ms; focus is a 2px accent outline offset 2px; active nudges down 1px. Loading swaps the icon for a spinner without changing width.
- **Secondary:** paper fill, 1px strong-rule border, navy label; hover to sunken. On night this becomes glass.
- **Ghost:** text only, sunken on hover; on the hero it takes a strong-rule border.

### Chips
- **Style:** 24px pill badges, caption medium, 10px horizontal padding, optional 14px leading icon.
- **Tones:** neutral (sunken), solid (navy on cream; "Verified student", "Live now"), outline (1px line, muted; "Coming next", "Planned"), accent (coral tint with deep coral), danger.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** paper on day; glass on night with backdrop blur.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px line.
- **Internal Padding:** 20px on the public site, 24px in the app, 32px on the sign-in card; inner rows divide with 1px lines.

### Inputs / Fields
- **Style:** 40px high, paper fill, 1px strong-rule border, 6px radius, body-sm text, muted placeholder. Label above in label weight; "Optional" in muted.
- **Focus:** border shifts to the accent with a 2px outline.
- **Error / Disabled:** border turns danger, the reserved message line below (min 20px) shows the error, so the form never jumps. Disabled uses the sunken fill and muted text.

### Navigation
- **Public header:** sticky, 64px, navy with the night scope; muted body-sm links that brighten to ink on hover; a small secondary "Sign in".
- **App header:** 64px on canvas with a bottom rule; current link in ink medium, others muted; status badge and avatar menu on the right. The menu pops in (160ms) as a 12px paper panel.

### Skill Proof (signature)
One line per skill: skill name (medium, 96px column from sm), then evidence. GitHub evidence in mono soft ink; self-added in muted italic. On phones evidence stacks under the skill and wraps rather than truncating. In the match preview, lines are read in left to right (clip reveal, 110ms stagger).

### Commit Cells (signature)
Small rounded squares, cream at 7% when idle and coral when they carry activity, with opacity scaled to the activity level (rest opacity 0.25 to 1). Used as a 12-week activity strip under a builder's name and as a loose lit cluster beside the hero card. Cells "catch light" (scale from 0.6, peak, settle) on a 45 to 80ms stagger.

### Motion
One easing, `cubic-bezier(0.16, 1, 0.3, 1)`. Arrive (600ms, rise 10px from a 4px blur), reveal (700ms clip, left to right), pop (160ms), tally (900ms count-up of an integer percentage, with the real value in a screen-reader span), lit (1400ms). Under reduced motion, arrive and pop become 200ms fades, and reveal, tally and lit are removed with cells resting at their final opacity.

## Do's and Don'ts

### Do:
- **Do** set navy text on coral (5.7:1) and navy on cream (13.7:1); use Deep Coral (#B8392A, 4.9:1) for any coral-family text on cream.
- **Do** wrap public hero, header, footer, sign-in and night sections in the night scope, and let dark mode reuse the same values.
- **Do** separate sections with a 1px rule or a switch to the night field, and separate panel rows with 1px lines.
- **Do** set evidence read from code in Geist Mono and label everything illustrative as illustrative.
- **Do** reserve the message line under every field so errors never shift the layout.
- **Do** give every animation a reduced-motion path that keeps state change visible.

### Don't:
- **Don't** set coral text on cream or paper (2.4:1).
- **Don't** add elevation shadows to panels, menus or buttons; the coral glow on lit cells is the only shadow.
- **Don't** add hues beyond navy, cream, coral and the danger pair.
- **Don't** place more than one coral light source in a night section, or the same bloom position in consecutive sections.
- **Don't** use mono for self-claimed skills or for decoration.
- **Don't** use uppercase tracked labels above headings; panel labels stay sentence-case captions.
