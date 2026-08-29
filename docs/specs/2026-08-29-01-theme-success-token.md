# Spec: Add `--success`, `--warning` and chart-fill tokens to the theme

> Status: Draft · 2026-08-29
> Design of record: [docs/specs/2026-08-29-cert-drill-design.md](./2026-08-29-cert-drill-design.md)
> Backlog issue: **#1** (no dependencies — first of the three foundational issues)

## Problem / Context

Cert Drill's whole point is telling you whether you got a question right, and
the theme has no way to say "right". `apps/nextjs/src/styles/tokens/colors.css`
ships `--destructive` but no success colour, and only the five generic
`--chart-1`…`--chart-5` slots — none of which carry the meaning the drill and
dashboard screens need (correct / self-graded / missed; fill-in / single /
multiple).

Every later UI issue (#5 doughnuts, #7 answered state, #8 self-grade, #9 run
summary) reaches for these colours. If each one invents its own hex literal,
the palette drifts and the "a missed fill-in is amber, never red" rule from the
design doc gets silently violated. Landing the tokens first, in one file, makes
every later issue a token reference instead of a colour decision.

## Goals

- The theme can express **success** as a first-class semantic colour, the same
  way it already expresses `destructive`.
- The six chart fills named in the design doc's
  [Design language](./2026-08-29-cert-drill-design.md#design-language) section
  exist as named, meaningful tokens — not as hex literals pasted into charts.
- Both the `:root` and `.dark` blocks stay internally coherent, so nothing in
  the file is a half-filled palette waiting to surprise someone.
- Zero visual change to anything that renders today.

## Non-Goals

- **Using the new tokens.** No component, chart, or page consumes them in this
  issue — they are consumed by issues #5 and #7–#9.
- **Applying the `dark` class.** The app is dark-only by design, but nothing
  currently puts `dark` on `<html>`. Fixing that touches `app/layout.tsx`,
  outside this issue's file set (see Open Questions).
- **Reworking `--chart-1`…`--chart-5`.** The existing numbered chart slots are
  left byte-for-byte untouched; the new fills are additive.
- **A light theme.** `:root` is filled in for coherence, not because a light
  mode is being shipped.
- **Any other token file.** `fonts.css`, `borders.css`, and the rest of
  `src/styles/tokens/` are out of scope.

## Requirements

### Functional

- `.dark` gains `--success: #39d98a` and a paired `--success-foreground` whose
  contrast against `#39d98a` is at least 4.5:1 (`#000000` satisfies this and
  mirrors the existing `--destructive-foreground: #000000` in the same block).
- `:root` gains a `--success` / `--success-foreground` pair that is coherent
  with how `--destructive` already differs between the two blocks (the light
  block uses a darker, less luminous variant so a light foreground reads on
  it). The pair must also clear 4.5:1. The exact light value is a plan-time
  choice; only the contrast property is a requirement.
- `.dark` gains **`--warning: #ffae04`** and a paired `--warning-foreground`
  clearing 4.5:1 against it (`#000000` does). `:root` gains the coherent light
  pair on the same terms as `--success` above.
  > **This token is what makes issue #8 implementable.** A no-match fill-in
  > renders amber, never red (decision **D3**) — and #8 forbids raw hex in
  > components. The only amber in the file today is `--chart-1`, a _chart_
  > token; using it for interface state would conflate two roles and make the
  > "amber, not red" rule impossible to enforce by review. `#ffae04` matches
  > `--chart-1`'s value deliberately: same hue, different semantic slot.
- Both blocks gain the **six** chart-fill tokens, with these values in `.dark`:

  | Token                 | Value     | Meaning                         |
  | --------------------- | --------- | ------------------------------- |
  | `--chart-correct`     | `#24a969` | outcome: answered correctly     |
  | `--chart-self-graded` | `#a57218` | outcome: self-graded "I had it" |
  | `--chart-missed`      | `#b02a2f` | outcome: missed                 |
  | `--chart-fill-in`     | `#a57218` | question mix: fill-in           |
  | `--chart-single`      | `#4a8df5` | question mix: single answer     |
  | `--chart-multiple`    | `#a258c1` | question mix: multiple answer   |

  These are the values the design doc records as already validated for
  colour-blind separation, chroma, and contrast against the dark card ground.
  They are **not** to be re-derived or "improved" in this issue.

- The `:root` block defines the same six token names. Because no light mode is
  shipping, reusing the same six values there is acceptable and preferred over
  leaving them undefined — an undefined token in `:root` is what makes
  `bg-chart-correct` silently transparent if the `dark` class is ever missing.
- `@theme inline` maps every new token to a Tailwind colour, following the
  existing `--color-<name>: var(--<name>)` pattern exactly, so the following
  utilities exist: `bg-success`, `text-success`, `border-success`,
  `text-success-foreground`, `bg-chart-correct`, `bg-chart-self-graded`,
  `bg-chart-missed`, `bg-chart-fill-in`, `bg-chart-single`,
  `bg-chart-multiple`.
- New declarations are placed adjacent to their semantic neighbours — the
  success pair immediately after the `--destructive` pair, the chart fills
  immediately after `--chart-5` — in all three blocks, so the three blocks stay
  in the same order as each other.

### Constraints

- **Only `apps/nextjs/src/styles/tokens/colors.css` changes.** No component, no
  layout, no config, no other token file. `backlog-runner`'s anomaly gate G2 #3
  blocks a diff that strays outside the plan's named files.
- Values are written as lowercase 6-digit hex, matching every existing entry in
  the file. No `oklch()`, no `color-mix()`, no CSS variables referencing other
  variables inside `:root` / `.dark`.
- The `#a57218` duplication between `--chart-self-graded` and `--chart-fill-in`
  is intentional and stays duplicated: they are two different facts that happen
  to share a colour, and collapsing them into one token would couple two
  unrelated charts. Do not alias one to the other.
- No new token may be introduced that the design doc does not name.
- `--chart-1` … `--chart-5` and every existing declaration keep their current
  values.
- Tailwind CSS 4 semantics: tokens must be reachable through `@theme inline`,
  not through a `tailwind.config` file (this repo has none).
- **No unnecessary comments.** Per `.claude/rules/principles.md`, comments
  explain _why_, never _what_ — the code already says what it does. Do not add
  section banners, `// Step 1:` sequences, a line that restates the line below
  it, or JSDoc that repeats a signature the types already carry. A comment
  earns its place only for a non-obvious invariant, a subtle ordering, or a
  decision whose reasoning is invisible in the code, and it stays to one line
  wherever possible. If the _why_ needs a paragraph, the design is too complex
  — simplify it instead of explaining it.

## Affected Areas

- [x] `apps/nextjs/src/styles/tokens/colors.css` — the only file this issue
      touches. Adds declarations to the `:root` block, the `.dark` block, and
      the `@theme inline` block.
- [ ] `apps/nextjs` (no feature or route changes)
- [ ] `apps/nextjs/prisma` (no schema/migration changes)
- [ ] `infra/**` — must not be touched (G2 #2 blocks unconditionally)

## Acceptance Criteria

- [ ] `git diff --stat` for the branch lists exactly one file:
      `apps/nextjs/src/styles/tokens/colors.css`.
- [ ] The `.dark` block contains the literal declaration `--success: #39d98a;`.
- [ ] The `.dark` block contains a `--success-foreground` declaration whose
      contrast ratio against `#39d98a` is ≥ 4.5:1.
- [ ] The `:root` block contains `--success` and `--success-foreground`
      declarations, and their contrast ratio against each other is ≥ 4.5:1.
- [ ] All six of `--chart-correct`, `--chart-self-graded`, `--chart-missed`,
      `--chart-fill-in`, `--chart-single`, `--chart-multiple` are declared in
      the `:root` block, in the `.dark` block, and mapped in `@theme inline`
      (18 new declarations total across the three blocks).
- [ ] In `.dark`, the six chart tokens hold exactly `#24a969`, `#a57218`,
      `#b02a2f`, `#a57218`, `#4a8df5`, `#a258c1` respectively.
- [ ] Rendering `<div class="dark"><span class="bg-success"></span></div>` and
      reading `getComputedStyle(span).backgroundColor` returns
      `rgb(57, 217, 138)`.
- [ ] Rendering the same wrapper with `class="bg-chart-correct"` returns
      `rgb(36, 169, 105)`; with `class="bg-chart-missed"` returns
      `rgb(176, 42, 47)`; with `class="bg-chart-multiple"` returns
      `rgb(162, 88, 193)`.
- [ ] `getComputedStyle` for `bg-chart-self-graded` and `bg-chart-fill-in` both
      return `rgb(165, 114, 24)` — i.e. the duplication survived, neither token
      resolved to nothing.
- [ ] `git diff` shows no modification to any line declaring `--chart-1`
      through `--chart-5`, `--destructive`, or `--destructive-foreground`.
- [ ] `bun run check-format` (repo root) exits 0.
- [ ] `bun run check-types` (repo root) exits 0.
- [ ] `turbo build --filter=nextjs` succeeds — i.e. Tailwind compiles the
      `@theme inline` block without an unresolved-variable warning.
- [ ] Loading `/` before and after the change produces visually identical
      screenshots (the tokens are additive and unconsumed).

## Open Questions / Risks

- **Nothing applies the `dark` class today.** `apps/nextjs/src/app/layout.tsx`
  renders `<html data-scroll-behavior="smooth" lang="en">` with no `dark` class
  and no theme provider, so the entire `.dark` block — existing tokens included
  — is currently inert. The design doc's "Dark only" commitment is therefore not
  yet realised anywhere in code. Fixing it means editing `layout.tsx`, which is
  outside this issue's file set, so the browser-based acceptance criteria above
  are written against an explicit `.dark` wrapper element rather than the page
  root. **A follow-up issue should add the `dark` class to `<html>`** before any
  UI issue (#5, #7–#9) relies on the dark palette.
- **The design doc's stated card colour is off by one digit.** It describes the
  existing `.dark` palette as `#0a0a0a` card; the file actually declares
  `--card: #090909`. The chart fills were validated for contrast "against
  `#0a0a0a`". The difference is imperceptible and does not change any
  pass/fail contrast verdict, but the design doc is the one that is wrong here,
  not the CSS — do not "fix" `--card` in this issue.
- **`oxfmt` does not format CSS.** `bun run check-format` will pass regardless
  of how the CSS is indented, and the Lefthook pre-commit hook only formats
  TS/JS/YAML/MD/JSON. Indentation and ordering consistency in `colors.css` is a
  review concern, not a tool-enforced one.
- **Semantic chart names deviate from the existing numbered convention.** The
  file currently uses `--chart-1`…`--chart-5`. Adding role-named siblings is a
  deliberate departure, justified because the design doc names these fills by
  role and because a numbered slot cannot carry the "missed fill-ins are amber,
  not red" rule. If a reviewer prefers `--chart-6`…`--chart-11`, that decision
  must be made in this issue — retrofitting names after issue #5 consumes them
  is a much larger diff.
- **Light-mode values are speculative.** `:root` is filled for coherence, but
  since no light mode is shipped, those values will never be seen and therefore
  never corrected by observation. This is accepted: the alternative — leaving
  `:root` incomplete — fails open (transparent backgrounds) rather than failing
  ugly.
