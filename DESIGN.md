# AnteRoom design notes

This describes what is built, not a wish list. If the code and this file
disagree, one of them is wrong and worth fixing. `app/globals.css` is the
source of truth for every value below.

## Who it is for

A company director who has just opened a letter from the ATO and is worried.
Every choice gets checked against that person, not against what looks
modern. Calm, plain, and obviously run by a real person.

## The look in one paragraph

Pale grey-green paper, near-black text, one deep teal brand colour, flat
panels with a 1px line, small corners, and a lot of left-aligned text on a
single column. There are no gradients, no shadows on cards, no glow, no
stock photos and no icons used as decoration. Structure comes from rules
(thin lines) and two-column bands, not from rows of identical cards.

## Layout

- One wide content column: up to 1760px, with side padding that grows with
  the screen (`--page-max` and `--page-pad`). The logo sits at the left
  edge and the menu at the right edge. The header, every section, the guide
  pages, the account pages and the footer all use the same edges so nothing
  looks inset. Text blocks keep their own narrow widths so lines stay easy
  to read.
- `.ar-band` and `.ar-row` make a two-column band: a heading on the left,
  the detail on the right. `.ar-facts` and `.ar-steps` are ruled lists, not
  card grids. Use these before reaching for `.ar-card`.
- `.ar-card` is for a thing a person acts on (a practitioner, a form
  panel). It is a flex column so a button can sit at the bottom with
  `.ar-card-action`.
- One dark teal band per page at most. Two make the page feel like a
  template.
- Guides use `GuideLayout`: article on the left, a free check box and the
  list of other guides on the right.

## Type

- Public Sans for everything: 400 body, 500 labels, 600 headings and
  buttons, 700 emphasis.
- Karst (only the 300 and 800 files exist) is for the homepage headline,
  big numbers and the wordmark. Nothing else. It has no in-between weights,
  so never use it for body text or fake a weight.
- `html { font-size: 120% }` on purpose, so 1rem is 19.2px and the text is
  comfortable to read. Do not change it without checking every page.
- Eight sizes only: `--text-xs`, `--text-sm`, `--text-base`, `--text-md`,
  `--text-lg`, `--text-xl`, `--text-2xl`, `--text-hero`. Use a token rather
  than writing a new size.

## Colour

Defined once on `.ar-root`.

- Surfaces: `--paper` (page), `--paper-raised` (panels, inputs).
- Text: `--ink`, `--ink-soft`. Lines: `--line`, `--line-strong`.
- Brand: `--brand`, `--brand-dark`, `--brand-tint`, `--on-dark` (text on
  the dark band).
- Meaning colours, never decoration: `--clay` is an error or something
  destructive, `--amber` is waiting, `--sage` is success or verified. Each
  has a `-tint` for backgrounds.

## Spacing and corners

- `--space-1` (4px at base) to `--space-10`. Use a token, not a hand-picked
  number. Related things sit within `--space-5`; a new section starts at
  `--space-7` or more.
- Corners are 4px for controls and tags, 6px for panels, 8px for dialogs.
  One system, not a different radius on every element.
- The only shadow is `--shadow-pop`, for dropdowns and dialogs.

## Components

All plain CSS classes in `globals.css`: buttons (`.ar-btn-primary`,
`.ar-btn-ghost`), form parts (`.ar-input`, `.ar-label`,
`.ar-checkbox-row`), `.ar-tag`, `.ar-hero` with `.ar-keyfacts`,
`.ar-cta-band`, `.ar-result-banner`, `.ar-sources`, `.ar-founder`, and the
account and practitioner layouts. The practitioner area has a thin teal bar
down the left edge (`.ar-practitioner-rail`) and a small "Practitioner"
badge in the header so a practitioner always knows where they are.

## Motion

Almost none. The results screen fades in once and quiz steps slide in. Both
switch off for people who ask their device for reduced motion. Do not add
page-load animation.

## Things we do not do

- Purple or blue gradients, glass effects, glows, bento grids, stock photos
  of people shaking hands.
- Fake social proof: no logos, testimonials or user counts we cannot back
  up. The practitioner profile example is labelled as an example.
- Controls that do nothing. A switch, a toggle or a "coming soon" setting
  that saves nothing is worse than no setting. The notifications page used
  to have these and now just says what actually happens.
- Facts we have not checked. Every guide lists its sources and the date it
  was last checked, and the dates, dollar amounts and deadlines come from
  the ATO, ASIC, the Federal Court or legislation. Update the date when you
  re-check, not before.
- Em dashes and en dashes anywhere in the copy or code. Use a comma, colon,
  full stop or the word "to". `npm test` fails if one appears, including as
  a `\u` escape or an HTML entity.
- Naming or implying a firm that has not agreed to be involved, or that is
  excluded from the network.

## Before you ship a change

1. Look at it. Render the page at desktop and phone width. Code that
   compiles is not the same as a page that looks right.
2. Run `npm test`.
3. Bump `BUILD_STAMP` in `lib/build.js` so the live page shows which version
   is running.
