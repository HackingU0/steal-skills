# Craft floor

Read before writing UI code (step 5), and again at the final check. These rules apply on top of
whatever the reference does: if the reference breaks one, that is a weakness to fix, not a style to
keep. Items marked ⚙ are checked automatically by `scripts/capture.mjs check`.

Distilled from Anthropic's `frontend-design` (Apache-2.0), pbakaus' `impeccable` (Apache-2.0),
Vercel's web interface guidelines (MIT) and taste-skill's checker (MIT); reworded here.

## 1. Plan before code

Write five lines before any CSS: the palette as named hex roles (surface, raised surface, text,
muted text, line, accent, accent-ink: 4–7 colours), type roles (display, heading, body, small, mono)
with sizes, the spacing base (4 or 8), radius scale, and **the one bold move**. Then read the plan
against section 2 and change anything that matches. A plan that could belong to any product is a
plan to redo.

## 2. AI tells: don't ship these unless the reference proves they serve this product

- Cream or beige background + serif display + terracotta/olive accent ("tasteful default").
- Near-black background with one acid accent and glowing gradients everywhere.
- Small uppercase tracked eyebrow above every heading ⚙. Use one only if it carries information.
- Gradient text ⚙; a coloured bar down one side of a rounded box; cards nested in cards.
- Every card the same rounded box with `rgba(0,0,0,.1)` shadow; every section fading up on scroll.
- "01 / 02 / 03" numbering on things that aren't a sequence; "A · B · C" meta strings; an arrow on
  every link; emoji as icons.
- Generic copy: "Learn more", "Get started" with no object, "Unlock the power of…".

## 3. Type

- Body text ≥16px on phones ⚙; measure 45–75 characters; line-height 1.4–1.6 for body.
- A deliberate scale (≈1.2–1.333 ratio) with few steps: more than ~12 distinct text styles reads as
  accidental ⚙. Headings must step down h1 > h2 > h3 ⚙.
- Display tracking slightly negative (−0.01 to −0.03em); never tighter than −0.04em. Small caps and
  labels get positive tracking.
- More space above a heading than below it. `text-wrap: balance` on headings.
- Numbers in tables and money: `font-variant-numeric: tabular-nums`.
- Open or licensed fonts only; match the reference's *character* (geometric, humanist, grotesk,
  mono), not the file.

## 4. Colour and depth

- Contrast: body text ≥4.5:1, large text ≥3:1 ⚙; input borders and other UI boundaries ≥3:1 (by eye:
  not measured). Text on images or gradients is flagged for a look, not measured. Muted text is where references
  most often fail.
- Secondary text on a coloured surface is tinted from that hue, not flat grey.
- Every colour comes from the tokens (`check --tokens tokens.css` compares the most-used colours ⚙;
  a one-off stray colour can slip past it).
- One elevation method per element: a border *or* a shadow, not both; at most 3–4 shadows in the
  whole system ⚙. Shadows tinted toward the background hue look intentional; pure black looks cheap.
- Radius: a small scale (e.g. 6 / 10 / 16 + full for pills) ⚙; inner radius = outer radius − padding.

## 5. Space and layout

- One spacing base, used everywhere; off-grid values are bugs.
- Group by proximity before adding lines or boxes.
- No horizontal overflow at 390px ⚙. Tap targets ≥44px on touch ⚙.
- Density follows the audience: tools can be dense; consumer and first-run screens breathe.

## 6. States and interaction

- Every control has hover, active, focus-visible, disabled; forms have loading, error, empty and
  success. Focus must be visible ⚙ (`check` tabs through the page with the keyboard; never
  `outline: none` without a replacement).
- State changes raise contrast; they don't just shift hue.
- Labels on every input (placeholders are not labels). Errors say how to fix it.
- Buttons say what happens ("Save changes"), and the confirmation reuses the verb ("Saved").
- Style the browser's own surfaces: selection colour, caret, scrollbar, link underline offset.

## 7. Motion

- Animate only `transform` and `opacity`; never `transition: all` ⚙.
- 120–200ms for feedback, ease-out; longer only for spatial moves.
- One authored motion moment per page, not a fade-up on every block.
- Respect `prefers-reduced-motion`; anything that loops more than 5s needs a pause.

## When to bring in design-taste-frontend

If the target is a marketing, company or landing page and `design-taste-frontend` is installed,
build the page with that skill, feeding it the stolen tokens and the "better than" decisions as the
brief, and run its checker as well as `capture.mjs check`. For app UI (dashboards, settings,
tables, forms), this file is enough; taste-skill's page rules are written for websites.
