---
name: Boilerplate Baseline
description: A strict monochrome, token-driven baseline system designed to accept a derived app's brand without redesign.
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
  ring: '#000000'
  destructive: '#e54b4f'
  destructive-foreground: '#ffffff'
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

# Design System: Boilerplate Baseline

## 1. Overview

**Creative North Star: "The Neutral Instrument"**

This system is a precision tool, not a personality. It is strict monochrome by
intent: black ink on near-white paper (light) and white ink on true black
(dark), with a single red reserved for destruction. The design's job is to make
hierarchy, state, and affordance unmistakable using only type weight, size,
spacing, and hairline borders — so that when a derived app grafts its brand
color onto the token layer, nothing else has to move.

It explicitly rejects SaaS-template maximalism — purple-to-blue gradients,
glassmorphism cards, hero-metric blocks, identical icon-heading-text card
grids — and the cream/beige "warm neutral" default. Neutral here is a decision,
not an absence.

**Key Characteristics:**

- Strict monochrome; color appears only when it carries meaning
- Hierarchy from type weight, size, and whitespace — never from decoration
- Hairline borders (#e4e4e4) and whisper-quiet shadows define structure
- Every visual value flows from `src/styles/tokens/`; components consume
  semantic classes (`bg-primary`, `text-muted-foreground`) exclusively
- Full light/dark parity out of the box

## 2. Colors

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

### Tertiary

- **Signal Red** (#e54b4f): destructive actions and validation errors only.

### Named Rules

**The Monochrome Rule.** Chromatic color is forbidden except: Signal Red for
destruction/errors, chart tokens for data visualization, and focus states.
If a screen needs emphasis, reach for weight and space, not hue.

**The Token Door Rule.** Color enters components only as semantic classes
(`bg-primary`, `text-muted-foreground`, `border-border`). A raw hex value or
Tailwind palette color (`bg-blue-500`) in a component is a defect.

## 3. Typography

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

## 4. Elevation

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

## 5. Components

Components come from shadcn/ui and live in `src/components/` (atoms →
molecules → organisms); their feel is refined and restrained — flat surfaces,
crisp edges, instant feedback.

### Buttons

- **Shape:** gently rounded (6px radius), 36px default height.
- **Primary:** Ink on white text (#000000 / #ffffff), 8px 16px padding, Label type.
- **Hover / Focus:** ~90% opacity shift on hover; 2px Ink focus ring offset from the element. No transforms.
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

## 6. Do's and Don'ts

### Do:

- **Do** express every color, radius, shadow, spacing, and font through the
  token files in `src/styles/tokens/` — that is the only door for visual change.
- **Do** use shadcn semantic classes (`bg-primary`, `text-muted-foreground`,
  `border-border`) and built-in `variant` props before any custom styling.
- **Do** ship loading (Skeleton), empty (Empty), error, and disabled states
  with every surface.
- **Do** keep body text at ≥4.5:1 contrast — Slate Text (#525252) is the
  lightest allowed body/muted color on light surfaces.
- **Do** honor `prefers-reduced-motion` with a crossfade or instant alternative
  for every animation.

### Don't:

- **Don't** use purple-to-blue gradients, glassmorphism cards, hero-metric
  blocks, or identical icon-heading-text card grids — the SaaS-template
  maximalism this system explicitly rejects.
- **Don't** introduce warm cream/beige neutrals; the baseline is strict
  monochrome by intent, not by omission.
- **Don't** write raw hex or Tailwind palette colors (`bg-blue-500`,
  `text-emerald-600`) in components — semantic tokens only.
- **Don't** use colored side-stripe borders, gradient text, or tiny uppercase
  tracked eyebrows above every section.
- **Don't** nest cards inside cards, or reach for a card when a border or
  spacing would do.
- **Don't** add decorative charts, badges, or stat tiles that don't answer a
  user question — dashboard clutter is an anti-reference.
