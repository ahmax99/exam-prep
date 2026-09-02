# Boilerplate residue in production: the wordmark says LOGO and every title ends in "Next.js Boilerplate"

**Issue:** [#53](https://github.com/ahmax99/exam-prep/issues/53)

## Problem

Two pieces of unmodified boilerplate ship in production and are visible to
every visitor at https://exam-prep.ahmax99.online:

1. `components/molecules/Logo.tsx` renders the literal string `LOGO` —
   top-left of every page, in bold, first in the tab order (wrapped in an
   unlabeled `<Link href="/">` in `PageHeader.tsx`, so a screen reader
   currently announces the link as "LOGO", not the product).
2. `features/metadata/constants/index.ts` sets `TITLE = 'Next.js
Boilerplate'` and `DESCRIPTION = 'A production-ready Next.js
boilerplate'`. `generatePageMetadata` suffixes every page title with
   `TITLE` (`Dashboard | Next.js Boilerplate`, `Drill | Next.js
Boilerplate`) and reuses both as `openGraph`/`twitter` title,
   description, and `siteName` — so the residue is in the tab title, the
   bookmark label, history entries, and any share/link preview.

## Naming decision

The issue depends on #39 (closed), "which decides what the product is
actually called." #39's own artifact, `PRODUCT.md`, explicitly declines to
make that call: _"No product name, logotype, or voice has been chosen; do
not invent one here"_ — and names this exact defect as the place that
naming decision belongs. Rather than invent a brand identity un-authorized
by the product doc, this was confirmed directly with the project owner:

**The product is named "Exam Prep"** — the name already in use everywhere
the product is referred to outside the code (the `exam-prep` GitHub repo,
the live `exam-prep.ahmax99.online` domain), not a new invention. Per the
issue's own fix sketch ("a typeset wordmark is fine — this design system is
deliberately typographic and does not need a drawn mark"), this stays a
plain typeset wordmark: no tagline, no drawn mark, no color beyond the
existing monochrome Ink token.

## Requirements

### R1 — Replace the `LOGO` placeholder

- `Logo.tsx` renders "Exam Prep" instead of "LOGO", keeping its existing
  typographic treatment (`text-2xl font-bold tracking-tight`).
- Add `data-slot="logo"` to the root element — a pre-existing gap against
  this repo's own convention (every atom/molecule root carries
  `data-slot`), trivial to close while already rewriting the file's only
  content.
- No `aria-label` needed on the wrapping `<Link href="/">` in
  `PageHeader.tsx`: once the link's text content is "Exam Prep" instead of
  "LOGO", its accessible name is correct automatically — this is real
  visible text, not an icon needing a label.

### R2 — Replace the title/description residue

- `features/metadata/constants/index.ts`: `TITLE` becomes `'Exam Prep'`;
  `DESCRIPTION` becomes a sentence drawn from `PRODUCT.md`'s own "Product
  Purpose" wording (a spaced-recall drill tool for certification exam
  prep), not invented copy.
- No other code changes needed here — `generatePageMetadata` and every
  route's `generateMetadata` call already compose off these two constants,
  so fixing them here fixes every page's title, `openGraph`, and `twitter`
  metadata at once.

## Acceptance Criteria

(verbatim from the issue)

- [ ] No page renders the string `LOGO`.
- [ ] No page title or metadata contains "Next.js Boilerplate".
- [ ] The tab title for the drill page identifies the product and the
      current context (e.g. "Drill | Exam Prep").

## Scope (files, verified against current `main`)

- `apps/nextjs/src/components/molecules/Logo.tsx`
- `apps/nextjs/src/features/metadata/constants/index.ts`

No other file references `LOGO` or `Next.js Boilerplate` (swept with
`grep -rln` across `src`) — `PageHeader.tsx` (the only `<Logo />` call site)
and every `generateMetadata` call site need no changes; they already
compose off the two files above.

## Non-Goals

- No drawn/graphic mark, favicon change, or color beyond the existing
  Ink token — the issue's fix sketch explicitly scopes this to a typeset
  wordmark.
- No further brand voice, tagline, or marketing copy — `PRODUCT.md` still
  has no confirmed brand commitments beyond the name itself; anything past
  the name/description swap here is new scope for a future issue.
