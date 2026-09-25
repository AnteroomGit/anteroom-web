# AnteRoom Design System

This documents the design decisions actually made and built into the
codebase, not an aspirational spec. If code and this file ever
disagree, that's a bug in one of them worth fixing, not a reason to
guess which one is "right."

## Personality

Calm, plain-English, trustworthy. Built for a company director reading
a Director Penalty Notice, not a SaaS buyer comparing tools. Confident,
not flashy. Every visual decision gets checked against this before
anything else: does it make sense for someone in genuine financial
distress, not just "does it look premium."

## Explicitly avoided, and why

- **Purple-to-blue gradients, glassmorphism, glow effects** — the most
  recognizable AI-generated-site tells that exist. Also just the wrong
  emotional register for this audience regardless.
- **Dark mode as a forced default, neo-brutalism, gamification,
  cinematic scroll storytelling, bento grids** — all genuinely current
  trends, all wrong for this specific brief. A trend needs a reason
  tied to the subject, not just currency.
- **Fabricated social proof** (customer logos, testimonials) —
  AnteRoom is pre-launch. Don't fake what isn't real yet.
- **Identical border-radius and padding on every card regardless of
  hierarchy** — a stat, a financial briefing, and a full result banner
  are different kinds of object and should read that way.
- **Tracked-out ALL-CAPS eyebrow labels** — tried once (the
  practitioner-mode indicator), correctly flagged as generic, replaced
  with a left-edge color rail plus a small sentence-case badge instead.

## Typography

One family, Karst, used everywhere — see `.ar-root`. Only two real
weight files exist, 300 and 800; there is no 400/500/600 to fall back
on, so hierarchy comes from size and letter-spacing, not fabricated
in-between weights. The scale (`.ar-display`, `.ar-h1` through
`.ar-h3`, `.ar-body` / `.ar-body-sm`) is defined once in `globals.css`
and should be reached for before any inline `fontSize` override.

## Color

Defined once as CSS custom properties on `.ar-root`: `--paper` (page
background), `--ink` / `--ink-soft` (text), `--brand` / `--brand-dark`
/ `--brand-tint` (the one primary accent), and three semantic
accents — `--clay` (errors, destructive actions), `--sage` (success,
verified), `--amber` (pending, awaiting action). These are meanings,
not decoration — a new use of clay/sage/amber should map to one of
those three meanings, not just "needed a color here."

## Spacing

A real base-8 scale, `--space-1` (4px) through `--space-10` (128px).
Related content stays inside `--space-6` (32px); a genuine section
break starts at `--space-7` (48px) or above. Always reach for a token
over a hand-picked rem value.

## Radius

Three steps, tied to hierarchy, not one flat number everywhere:
`--radius-sm` (8px — tags, chips, inputs), `--radius-md` (12px —
standard cards, buttons), `--radius-lg` (20px — the few genuine
centerpieces: hero, modal, a revealed result).

## Components

Currently a CSS-class system (`.ar-card`, `.ar-btn-primary`,
`.ar-btn-ghost`, `.ar-stat-card`, `.ar-status-bar`, etc.) in
`globals.css`, not extracted React components. That's a real,
legitimate next architectural step, not yet done — worth its own
dedicated pass rather than a rushed retrofit.

## Motion

Deliberately sparse. Exactly one orchestrated moment exists
(`.ar-results-reveal`, on the triage results screen) rather than a
generic fade-in on every section. Add motion only where it responds to
something the person actually did or where it marks a genuine
emotional peak, not as page-load decoration. Respect
`prefers-reduced-motion`.

## Process

Before touching UI: check this file. After a visible change: actually
render it (a static preview with the real CSS file, or the real app)
and look at it before calling it done — code that compiles is not the
same as code that looks like the plan.
