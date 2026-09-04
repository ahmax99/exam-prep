---
name: Exam Prep Design System
description: A near-monochrome, token-driven system for a personal LPIC-1 drill tool, with a single cobalt accent for the primary action and color otherwise reserved for answer verdicts, mastery state, and data visualization.
colors:
  primary: '#000000'
  primary-foreground: '#ffffff'
  background: '#fcfcfc'
  card: '#ffffff'
  secondary: '#ebebeb'
  muted: '#f5f5f5'
  muted-foreground: '#525252'
  border: '#e4e4e4'
  input: '#ebebeb'
  ring: '#1f3cf5'
  brand: '#1f3cf5'
  brand-foreground: '#ffffff'
  destructive: '#e54b4f'
  destructive-foreground: '#ffffff'
  success: '#1a7f4f'
  success-foreground: '#ffffff'
  warning: '#916417'
  warning-foreground: '#ffffff'
  chart-correct: '#24a969'
  chart-self-graded: '#a57218'
  chart-missed: '#b02a2f'
  chart-fill-in: '#a57218'
  chart-single: '#4a8df5'
  chart-multiple: '#a258c1'
typography:
  display:
    fontFamily: 'Geist Sans, sans-serif'
    fontSize: '3rem'
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: '-0.01em'
  headline:
    fontFamily: 'Geist Sans, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '0'
  title:
    fontFamily: 'Geist Sans, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: '0.01em'
  body:
    fontFamily: 'Geist Sans, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '0.01em'
  label:
    fontFamily: 'Geist Sans, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: '0.01em'
  mono:
    fontFamily: 'Geist Mono, monospace'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '0'
rounded:
  sm: '4px'
  md: '6px'
  lg: '8px'
  xl: '12px'
spacing:
  xs: '2px'
  sm: '4px'
  md: '8px'
  lg: '16px'
  xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  button-brand:
    backgroundColor: '{colors.brand}'
    textColor: '{colors.brand-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  button-secondary:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  input:
    backgroundColor: '{colors.card}'
    textColor: '{colors.primary}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '8px 12px'
  card:
    backgroundColor: '{colors.card}'
    textColor: '{colors.primary}'
    rounded: '{rounded.xl}'
    padding: '24px'
  badge:
    backgroundColor: '{colors.muted}'
    textColor: '{colors.muted-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: '2px 8px'
---

# Design System: Exam Prep Design System

## Overview

**Creative North Star: "The Neutral Instrument"**

This system is a precision tool, not a personality. It is near-monochrome by
intent: black ink on near-white paper (light) and white ink on true black
(dark), with color reserved for meaning — the primary action, destruction,
answer verdicts, mastery state, and data visualization. The design's job is to make hierarchy,
state, and affordance unmistakable using type weight, size, spacing, and
hairline borders first, so that the handful of chromatic signals that do exist
stay legible instead of competing with decoration.

It explicitly rejects SaaS-template maximalism — purple-to-blue gradients,
glassmorphism cards, hero-metric blocks, identical icon-heading-text card
grids — and the cream/beige "warm neutral" default. Neutral here is a decision,
not an absence.

**Key Characteristics:**

- Near-monochrome; color appears only when it carries meaning (the one peak
  action, destructive, answer verdict, mastery state, or chart data)
- Hierarchy from type weight, size, and whitespace — never from decoration
- Hairline borders (#e4e4e4) and whisper-quiet shadows define structure
- Every visual value flows from `src/styles/tokens/`; components consume
  semantic classes (`bg-primary`, `text-muted-foreground`) exclusively
- Full light/dark parity out of the box

## Colors

A two-pole monochrome ramp with one semantic red; the palette is deliberately
brandless so the primary slot can be recolored per app.

### Primary

- **Ink** (#000000): the primary action color and text color. Buttons, focus
  rings, and headings all share it — authority through uniformity. In dark
  mode the poles flip (white ink on black).

### Neutral

- **Paper** (#fcfcfc): the app canvas. Not pure white, so cards can sit on it.
- **Card White** (#ffffff): elevated surfaces — cards, popovers, inputs.
- **Whisper Gray** (#f5f5f5): muted fills — skeletons, table stripes, badges.
- **Control Gray** (#ebebeb): secondary buttons, input borders, accents.
- **Hairline** (#e4e4e4): borders and dividers; the structural line weight.
- **Slate Text** (#525252): muted foreground — descriptions, captions,
  placeholders. Passes 4.5:1 on all neutral surfaces; do not lighten it.

### Accent

- **Cobalt** (#1f3cf5 light / #6e8cff dark): the single chromatic accent, and
  the only hue in the palette that carries no verdict meaning — green, amber
  and red are already spoken for by correct / shaky / wrong, so nothing else
  could mark an action without being misread as a grade. It has exactly four
  jobs: the one peak action per surface (`RecommendedDrill`, the drill card's
  Submit / Next), run progress, focus rings, and a selection in progress (a
  chosen answer option, the selected exam row). It passes both directions —
  6.8:1 as ink on paper, 7.0:1 with white on it — so it works as text and as
  a filled ground. It never appears in a chart, a verdict, or a mastery bar.

### Tertiary

- **Signal Red** (#e54b4f): destructive actions and validation errors only.

### Feedback

- **Verdict Green** (#1a7f4f): a correct answer, and the mastered portion of
  a `MasteryBar` (a question that has been answered correctly two times in a
  row). The one chromatic "you got this right" signal in the system.
- **Verdict Amber** (#916417): the shaky portion of a `MasteryBar` — a
  question answered correctly once, not yet enough to call mastered. Distinct
  from Signal Red: amber means "not solid yet," not "wrong."

### Data Visualization

Chart tokens are scoped to two roles and never reused as UI feedback color:

- **Categorical** (`chart-1`…`chart-5`): generic series color for charts with
  no inherent semantic mapping (e.g. a doughnut segmented by question type).
- **Semantic** (`chart-correct` #24a969, `chart-self-graded` #a57218,
  `chart-missed` #b02a2f, `chart-fill-in` #a57218, `chart-single` #4a8df5,
  `chart-multiple` #a258c1): fixed meaning across every chart that plots
  answer outcomes or question-type mix, so the same color always means the
  same thing from chart to chart.

### Named Rules

**The Monochrome Rule.** Chromatic color is forbidden except: Cobalt for the
one peak action, progress, focus and in-progress selection; Signal Red for
destruction/errors; Verdict Green/Amber for answer correctness and mastery
state; and chart tokens for data visualization. If a screen needs emphasis
anywhere else, reach for weight and space, not hue.

**The One Peak Rule.** A surface spends the accent once. If two things on a
page are cobalt, neither is the peak — demote one to Ink (`default`) or to a
bordered/ghost treatment. This is what keeps the accent legible as "the thing
to do next" rather than decoration.

**The Verdict Reservation.** Green, amber and red belong to answer outcomes
and mastery state, and to nothing else. Never reach for them to emphasize an
action, and never let the accent stand in for a grade.

**The Token Door Rule.** Color enters components only as semantic classes
(`bg-primary`, `text-muted-foreground`, `border-border`). A raw hex value or
Tailwind palette color (`bg-blue-500`) in a component is a defect.

## Typography

**Display Font:** Geist Sans (with system sans-serif fallback)
**Body Font:** Geist Sans
**Label/Mono Font:** Geist Mono

**Character:** One family across every register — technical, contemporary,
quietly confident. Contrast comes from weight (400/500/600) and size, with a
slightly open body tracking (+0.01em) that keeps small text legible.

### Hierarchy

- **Display** (600, 3rem, 1.1): page heroes and marketing headlines only.
- **Headline** (600, 1.875rem, 1.25): page titles.
- **Title** (500, 1.25rem, 1.375): card titles and section headings.
- **Body** (400, 1rem, 1.5, +0.01em): default text; cap measure at 65–75ch.
- **Label** (500, 0.875rem, 1.25): buttons, form labels, table headers.
- **Mono** (400, 0.875rem): code, IDs, and tabular data.

### Named Rules

**The One Family Rule.** Geist carries everything. Introducing a second
display face is a per-app branding decision made in `tokens/fonts.css`,
never inline.

## Layout

A single centred content column over a persistent left rail, sized so a ruled
row can be read end to end without the eye losing the line.

- **App shell:** a sticky 56px header (Hairline underline, no shadow), a
  collapsible icon sidebar on `lg` and up, and a fixed 64px bottom tab bar
  below it. The tab bar's height and the reservation under the content come
  from one token (`--bottom-nav-height`, plus `env(safe-area-inset-bottom)`)
  so the two can never drift apart.
- **Content column:** 48rem until `lg`, then 64rem, with 16px gutters
  stepping to 32px. 64rem is a deliberate ceiling, not a default: at the
  wider measure a ruled row's label and its value sat roughly 1200px apart,
  past the distance the eye tracks a row.
- **Drill surface:** its own wider frame — 40rem for the question column,
  opening to 67rem at `xl` where a 15rem context rail joins it as a
  `[minmax(0,1fr)_15rem]` grid. It is top-anchored, never vertically
  centred, because centring re-positions the question on every advance.
- **Spacing rhythm:** a 4px base (`--spacing-base`) with named steps at 2 /
  4 / 8 / 16 / 32px. Section separation runs at 48px (`mt-12`), the peak
  action gets 32px of air, and related content groups at 4-16px.
- **Breakpoints:** the stock 640 / 768 / 1024 / 1280 / 1536px set, with the
  `.container` utility capping at 1400px above 1536.

### Named Rules

**The Row-Reach Rule.** A row's label and the value it belongs to stay within
one comfortable eye-sweep. If a list needs more width than that, the column
is too wide — narrow the container rather than stretching the row.

**More Space Above Than Below.** A section heading sits closer to the content
it introduces than to the section it follows; the rule under a heading binds
it downward.

## Elevation & Depth

Structure is drawn, not lifted: hairline borders do the primary work, and
shadows are a whisper (1–2px offsets at 9–18% black) that separates floating
surfaces (popovers, dialogs, dropdowns) from the page. Cards at rest carry at
most `shadow-2xs`; nothing on the canvas casts a dramatic shadow.

### Shadow Vocabulary

- **Resting** (`0px 1px 2px 0px hsl(0 0% 0% / 0.09)`): cards, inputs.
- **Raised** (`0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 2px 4px -1px hsl(0 0% 0% / 0.18)`): dropdowns, popovers.
- **Floating** (`0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 8px 10px -1px hsl(0 0% 0% / 0.18)`): dialogs, sheets.

### Named Rules

**The Drawn-Not-Lifted Rule.** If a border can express the boundary, use the
border. Shadows are reserved for surfaces that genuinely float above the page.

## Shapes

Structure is drawn with a single hairline weight and a tight radius scale;
there is no second line weight and no decorative geometry.

- **Radius scale** derives from one base (`--radius-base: 0.5rem`): 4px
  (`sm`, badges and the option-letter keys), 6px (`md`, buttons), 8px (`lg`,
  inputs, option rows, wells) and 12px (`xl`, cards and the accent action
  panel). Nothing in the system is fully square or fully round except the
  pill-shaped progress and mastery bars.
- **Borders** are 1px, always. The Hairline (#e4e4e4 / #242424) draws card
  edges, list rules, column dividers and the header underline alike; a
  heavier or colored rule is not part of the vocabulary.
- **Rules over boxes.** A comparable or ranked list is hairline-ruled rows on
  a shared baseline, not a stack of bordered cards. A card is reserved for a
  genuinely distinct navigable object.
- **The block cursor** — a solid accent rectangle roughly one mono character
  wide — is the system's only recurring non-rectilinear-grid mark, and it
  belongs to the wordmark.

### Named Rules

**The One Line Weight Rule.** Every border in the system is 1px in the
Hairline color. If a boundary needs more emphasis than that, it needs more
space or more type weight, not a thicker rule.

## Components

Components come from shadcn/ui and live in `src/components/` (atoms →
molecules → organisms); their feel is refined and restrained — flat surfaces,
crisp edges, instant feedback.

### Buttons

- **Shape:** gently rounded (6px radius), 36px default height.
- **Primary:** Ink on white text (#000000 / #ffffff), 8px 16px padding, Label type.
- **Hover / Focus:** ~90% opacity shift on hover; 2px Ink focus ring offset from the element. No transforms.
- **Brand:** Cobalt fill with white text, for the single peak action on a surface (see The One Peak Rule). A blocked or pending primary action steps down to `outline` rather than shipping a washed-out accent, which reads as broken.
- **Secondary / Ghost / Destructive:** Control Gray fill / transparent with hover fill / Signal Red. All via shadcn `variant` props — never custom classes.
- **Loading:** compose `Spinner` + `disabled`; no bespoke spinners.

### Cards / Containers

- **Corner Style:** 12px radius.
- **Background:** Card White on Paper canvas.
- **Shadow Strategy:** Resting shadow or border only (see Elevation).
- **Border:** 1px Hairline.
- **Internal Padding:** 24px, via full Card composition (`CardHeader`/`CardContent`/`CardFooter`).

### Inputs / Fields

- **Style:** Card White fill, 1px Control Gray border, 6px radius, 8px 12px padding.
- **Focus:** border shifts to Ink plus 2px ring; no glow.
- **Error / Disabled:** Signal Red border + `aria-invalid`/`data-invalid` per shadcn Field rules; disabled drops to 50% opacity.
- **Layout:** always `FieldGroup` + `Field` — never raw divs with spacing utilities.

### Navigation

- **Style:** flat top bar / sidebar on Paper, Hairline separation; active item gets Ink text + Whisper Gray fill; inactive is Slate Text. Mobile collapses to Sheet.

### Feedback & States

- **Loading:** `Skeleton` blocks mirroring final layout — no custom pulse divs.
- **Empty:** the `Empty` component with one clear next action.
- **Toasts:** `sonner`, bottom-right, Label type.

## Do's and Don'ts

### Do:

- **Do** express every color, radius, shadow, spacing, and font through the
  token files in `src/styles/tokens/` — that is the only door for visual change.
- **Do** use shadcn semantic classes (`bg-primary`, `text-muted-foreground`,
  `border-border`) and built-in `variant` props before any custom styling.
- **Do** ship loading (Skeleton), empty (Empty), error, and disabled states
  with every surface.
- **Do** keep body text at ≥4.5:1 contrast — Slate Text (#525252) is the
  lightest allowed body/muted color on light surfaces.
- **Do** rely on `src/styles/tokens/motion.css`'s blanket
  `prefers-reduced-motion` rule, which already covers every animation by
  default. Reach for a bespoke crossfade only when an animation carries
  meaning rather than decoration.

### Don't:

- **Don't** use purple-to-blue gradients, glassmorphism cards, hero-metric
  blocks, or identical icon-heading-text card grids — the SaaS-template
  maximalism this system explicitly rejects.
- **Don't** introduce warm cream/beige neutrals; the baseline is near-
  monochrome by intent, not by omission.
- **Don't** spend the accent twice on one surface, or on anything that is not
  an action, progress, focus, or an in-progress selection.
- **Don't** stack a page out of identically-bordered cards. A ranked or
  comparable list is hairline-ruled rows sharing one baseline; a card is for a
  genuinely distinct navigable object, and never nested inside another card.
- **Don't** write raw hex or Tailwind palette colors (`bg-blue-500`,
  `text-emerald-600`) in components — semantic tokens only.
- **Don't** use colored side-stripe borders, gradient text, or tiny uppercase
  tracked eyebrows above every section.
- **Don't** nest cards inside cards, or reach for a card when a border or
  spacing would do.
- **Don't** add decorative charts, badges, or stat tiles that don't answer a
  user question — dashboard clutter is an anti-reference.
