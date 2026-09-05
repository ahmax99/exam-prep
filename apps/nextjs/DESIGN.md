---
name: Exam Prep Design System
description: A token-driven terminal colour scheme for a personal LPIC-1 drill tool, built on hue-tinted neutrals with three chromatic tiers - one action blue, a five-step categorical arc for taxonomy, and a reserved verdict triad.
colors:
  primary: '#0f1727'
  primary-foreground: '#fafcfe'
  background: '#f5f8fd'
  card: '#fefeff'
  secondary: '#e1e9f5'
  muted: '#ecf2fa'
  muted-foreground: '#57647a'
  accent: '#deecfc'
  accent-foreground: '#0c2c5a'
  border: '#d5deec'
  input: '#d5deec'
  ring: '#2a61ec'
  brand: '#2a61ec'
  brand-foreground: '#fafcff'
  destructive: '#c21b27'
  destructive-foreground: '#fafcfe'
  success: '#007d48'
  success-foreground: '#fafcfe'
  warning: '#8d6600'
  warning-foreground: '#fafcfe'
  sidebar: '#ebf2fb'
  category-1: '#009a9a'
  category-2: '#006389'
  category-3: '#687be5'
  category-4: '#78389a'
  category-5: '#cb5792'
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

**Creative North Star: "The Terminal Scheme"**

This system is a precision tool that admits what it is for. Its user is
studying Linux system administration, and it borrows the one colour tradition
that audience already reads fluently: the terminal scheme. Every neutral is
mixed toward a single cool blue rather than left as gray, so the ground itself
carries the hue and the marks placed on it belong to the same world instead of
sitting on it as stains. Light is a daylight terminal; dark is a night one.

Colour here is never decoration, and it is never a free choice at the call
site. There are exactly three chromatic tiers, and everything chromatic in the
app is in one of them:

1. **Action** — one blue (264deg). The peak action, focus, progress, selection.
2. **Taxonomy** — a five-step categorical arc. Topics, objectives, chart series.
3. **Verdict** — green, amber, red. Answer outcome and mastery state, nothing else.

It still rejects SaaS-template maximalism — purple-to-blue gradients,
glassmorphism, hero-metric blocks, identical icon-heading-text card grids — and
still rejects the cream/beige "warm neutral" default. What changed is that the
absence of colour is no longer the position; a disciplined, fully-specified
colour system is.

**Key Characteristics:**

- Tinted neutrals throughout — no pure gray, no pure black, no pure white
- Every chromatic value belongs to one of the three tiers above
- Hierarchy from type weight, size and whitespace first; colour confirms it
- Hairline borders and whisper-quiet shadows define structure
- Every visual value flows from `src/styles/tokens/`; components consume
  semantic classes (`bg-primary`, `text-muted-foreground`) exclusively
- Full light/dark parity, each composed rather than inverted

## Colours

Every value is derived in OKLCH and converted to sRGB, so ramps share a hue and
step predictably in lightness. All 76 foreground/background pairs the system
can produce were checked against WCAG AA before shipping.

### Neutrals

Mixed toward 258deg. The hue is faint in light and pronounced in dark, but it
is never zero.

- **Canvas** (#f5f8fd / #0a111b): the app ground.
- **Card** (#fefeff / #131b27): elevated surfaces — cards, popovers, inputs.
- **Muted** (#ecf2fa / #1e2633): muted fills — skeletons, badges, chart tracks.
- **Secondary** (#e1e9f5 / #252f3d): secondary buttons, bar tracks.
- **Accent** (#deecfc / #293a4d): the tinted hover and active fill.
- **Hairline** (#d5deec / #2b3544): borders and dividers; one line weight.
- **Ink** (#0f1727 / #f0f4f9): body text and the `default` button.
- **Slate Text** (#57647a / #9facbe): muted foreground. Passes 4.5:1 on every
  neutral surface above; do not lighten it.
- **Rail** (#ebf2fb / #111823): the sidebar plane, deliberately offset from the
  canvas so the rail and the content column are different surfaces.

### Tier 1 — Action

- **Signal Blue** (#2a61ec light / #7da7ff dark): the single action hue. It has
  four jobs and no others: the one peak action per surface, run progress, focus
  rings, and a selection in progress. It passes both directions — as text on
  every neutral surface, and as a ground under its own foreground. It never
  appears as a verdict, and it never appears in a chart.

### Tier 2 — Taxonomy

`category-1` … `category-5` — the categorical arc, stepping evenly 195 -> 351deg
with lightness alternating light/deep along the way:

| Token        | Light     | Dark      |
| ------------ | --------- | --------- |
| `category-1` | `#009a9a` | `#00e0e0` |
| `category-2` | `#006389` | `#00a5e2` |
| `category-3` | `#687be5` | `#b1c1ff` |
| `category-4` | `#78389a` | `#b67cd8` |
| `category-5` | `#cb5792` | `#ffa4ce` |

Both axes are load-bearing. sRGB clamps chroma hard through cyan and blue, so
at a single lightness those hues converge into the same dark teal and stop
being tellable apart at swatch size — the alternating lightness is what keeps
neighbours distinct, and it is also what keeps them distinct under red-green
colour-vision deficiency.

The `chart-*` tokens are **aliases** onto this arc and the verdict tier, never
their own colours: a topic's dot in a list and its arc in a chart have to be
the same swatch or the coding is a lie.

### Tier 3 — Verdict

- **Verdict Green** (#007d48 / #32d58b): a correct answer, and the mastered
  portion of a `MasteryBar`.
- **Verdict Amber** (#8d6600 / #dca744): the shaky portion of a `MasteryBar` —
  answered correctly once, not yet enough to call mastered. Also the bookmarked
  state. "Not solid yet," never "wrong."
- **Signal Red** (#c21b27 / #f86a6b): a wrong answer, destructive actions, and
  validation errors.

All three are used as text as well as fills, so all three hold 4.5:1.

### Named Rules

**The Three Tiers Rule.** Every chromatic value in the app is action, taxonomy,
or verdict. There is no fourth tier and no one-off hue. If something needs
emphasis and is none of those three, it gets weight and space, not colour.

**The One Peak Rule.** A surface spends the action blue once. If two things on a
page are blue, neither is the peak — demote one to Ink (`default`) or to a
bordered/ghost treatment. A blocked or pending primary action steps down to
`outline` rather than shipping a washed-out accent, which reads as broken.

**The Verdict Reservation.** Green, amber and red belong to answer outcomes and
mastery state, and to nothing else. Never reach for them to emphasise an
action, and never let the action blue stand in for a grade. This is why the
taxonomy arc lives entirely on the cool half of the wheel: the warm half is
spoken for.

**The Assigned-Not-Hashed Rule.** Taxonomy colour is assigned by order of first
appearance within the list being rendered (`categoryColors` in
`src/utils/categoryColor.ts`), not by hashing the key. With five hues and a
handful of topics a hash collides often enough that two rows in one list come
out the same colour — the one thing the coding must never do.

**The Token Door Rule.** Colour enters components only as semantic classes
(`bg-primary`, `text-muted-foreground`, `border-border`) or as a
`var(--category-n)` handed down from `categoryColors`. A raw hex value or
Tailwind palette colour (`bg-blue-500`) in a component is a defect.

**Tinted, Never Gray.** No pure gray, pure black or pure white anywhere in the
palette. If a value needs to read as neutral, it is the 258deg neutral at low
chroma — not `#000`, `#fff`, or a Tailwind `gray-*`.

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
- **Brand:** Signal Blue fill with its own foreground, for the single peak action on a surface (see The One Peak Rule). A blocked or pending primary action steps down to `outline` rather than shipping a washed-out accent, which reads as broken.
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
- **Do** keep body text at ≥4.5:1 contrast — Slate Text (#57647a) is the
  lightest allowed body/muted colour on light surfaces.
- **Do** rely on `src/styles/tokens/motion.css`'s blanket
  `prefers-reduced-motion` rule, which already covers every animation by
  default. Reach for a bespoke crossfade only when an animation carries
  meaning rather than decoration.

### Don't:

- **Don't** use purple-to-blue gradients, glassmorphism cards, hero-metric
  blocks, or identical icon-heading-text card grids — the SaaS-template
  maximalism this system explicitly rejects.
- **Don't** introduce warm cream/beige neutrals, or reach for a pure gray,
  black or white. Neutrals are the 258deg cool tint at low chroma.
- **Don't** spend the action blue twice on one surface, or on anything that is
  not an action, progress, focus, or an in-progress selection — and don't
  introduce a chromatic value that belongs to none of the three tiers.
- **Don't** stack a page out of identically-bordered cards. A ranked or
  comparable list is hairline-ruled rows sharing one baseline; a card is for a
  genuinely distinct navigable object, and never nested inside another card.
- **Don't** write raw hex or Tailwind palette colours (`bg-blue-500`,
  `text-emerald-600`) in components — semantic tokens only, and taxonomy
  colour only via `categoryColors`.
- **Don't** use colored side-stripe borders, gradient text, or tiny uppercase
  tracked eyebrows above every section.
- **Don't** nest cards inside cards, or reach for a card when a border or
  spacing would do.
- **Don't** add decorative charts, badges, or stat tiles that don't answer a
  user question — dashboard clutter is an anti-reference.
