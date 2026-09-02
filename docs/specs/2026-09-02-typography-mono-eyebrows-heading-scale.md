# Typography drifts from DESIGN.md: mono for prose, uppercase eyebrows, flat heading scale

**Issue:** [#45](https://github.com/ahmax99/exam-prep/issues/45)

## Problem

The app's typography has drifted from its own re-derived `DESIGN.md`
(closed under #39) in three specific ways, all visible on
`/lpic-1`:

1. **Monospace carrying prose.** `DESIGN.md` §3 scopes Mono to "code, IDs,
   and tabular data." Two places set an ordinary sentence or a multi-word
   human-readable label in `font-mono`:
   - The `"{count} questions across {N} topics · {M} objectives"` summary
     line on the certification page — a sentence, not a token.
   - Topic names (`"103 — GNU & Unix Commands"`) in the topic list — a prose
     label a person reads, not an ID they'd type or match exactly.
2. **Tiny uppercase tracked eyebrows.** `DESIGN.md` §6 lists these under
   **Don't** by name. Three live instances remain:
   - `EXPLANATION` above the drill card's explanation panel
     (`text-xs font-medium tracking-wide uppercase`).
   - `MASTERED` / `MISSED` / `UNSEEN` in the certification card's stat row
     (inherited `font-mono text-xs` + `uppercase` on each `<dt>`).
   - `QUESTIONS` / `ANSWERS` under each doughnut chart's center total
     (`font-mono text-[10px] uppercase`).
3. **Compressed heading scale.** `DESIGN.md` §3 specifies Headline at
   `1.875rem/600` (`text-3xl leading-tight font-semibold` in this app's
   Tailwind scale — `--leading-tight` already resolves to the documented
   `1.25`) and Title at `1.25rem/500` (`text-xl leading-snug font-medium` —
   `--leading-snug` resolves to `1.375`). The certification page's `h1`
   (`text-2xl font-semibold`, 1.5rem) and its section `h2`s
   (`text-lg font-medium`/`font-semibold`, 1.125rem) both fall short of and
   sit too close to each other, so the page/section hierarchy reads flat.

**Also:** the exam heading renders as **"Exam 101 — Exam 101 Mixed"**
because the seeded exam title is itself `"Exam 101 Mixed"` and the page
prefixes `Exam {code} — `. Both halves carry the exam number.

## Non-Goals

- `RunSummary.tsx`'s `h1` (`text-xl leading-snug font-medium` — the
  documented **Title** scale used for a page-level `h1`) is a pre-existing,
  separate inconsistency from what this issue reports. Out of scope here;
  worth its own follow-up if the team wants every page `h1` to converge on
  one scale.
- No new typography tokens are added. `--leading-tight` (1.25) and
  `--leading-snug` (1.375) in `tokens/typography.css` already match
  `DESIGN.md`'s Headline/Title line-heights exactly, and Tailwind's default
  `text-3xl`/`text-xl` already match the documented `rem` sizes — this is a
  class-name fix, not a token-authoring one.

## Requirements

### R1 — Move prose off mono

- Certification page's `"{count} questions across..."` line: drop
  `font-mono`.
- `TopicMasteryPanel`'s topic-name span: drop `font-mono`. The adjacent
  `{mastered}/{total}` fraction stays mono (a numeric ratio).
- Leave every other mono usage untouched — exam/objective codes
  (`101`, `101.1`), question counters (`1 / 20`), percentages, keyboard-shortcut
  `<kbd>` hints, and the doughnut center totals are all legitimate IDs or
  tabular data per `DESIGN.md` and stay exactly as they are.

### R2 — Remove the three uppercase-tracked eyebrows

- `ExplanationPanel`: delete the `EXPLANATION` `<p>` entirely. The `<section>`
  already carries `aria-label="Explanation"`, so screen-reader users lose
  nothing; sighted users already see it's an explanation from its position
  and content.
- `CertificationCard`'s stat row: stop the `<dt>` labels
  (`Mastered`/`Missed`/`Unseen`) from inheriting `font-mono` and drop their
  `uppercase` class. Keep the `<dd>` digit values in mono (genuinely
  tabular). The labels become a plain small caption, not an eyebrow.
- `DoughnutChart`'s center unit label (`questions`/`answers`): drop
  `font-mono` and `uppercase`. Stays small and quiet under the total, just
  not in the forbidden register.

### R3 — Bring `h1`/`h2` onto the documented scale

- Certification page `h1` (certification name): `text-2xl font-semibold` →
  `text-3xl leading-tight font-semibold` (Headline).
- Certification page section `h2`s ("Exam … — …", "Or pick a scope") and
  `TopicMasteryPanel`'s own `h2` ("Topics"): converge on
  `text-xl leading-snug font-medium` (Title) — currently one is
  `font-medium` and the other `font-semibold`, and neither hits the
  documented size. Fixing only the top-level pair while leaving "Topics" at
  its old size would leave the page inconsistent, so this normalizes all
  three same-role headings together, not just the ones the issue's
  acceptance criteria measures directly.

### R4 — Fix the doubled "Exam 101" heading

- Change the composed heading from `Exam {code} — {title}` to just
  `{title}` (renders "Exam 101 Mixed", matching the seeded exam title
  verbatim) when the title already starts with `Exam {code}`— i.e. drop the
  redundant prefix rather than editing the seeded title text, since the
  prefix is presentation logic in `page.tsx` and the title is data. If a
  future exam's title doesn't already start with its own code, prefixing it
  is still occasionally desirable — but no such exam exists today (`Exam
101 Mixed`, `Exam 102 Mixed` both already lead with their code), so a
  literal "does the title already start with `Exam {code}`" check keeps the
  logic correct for both today's data and any future title that doesn't
  duplicate the code.

## Acceptance Criteria

(verbatim from the issue, all still apply)

- [ ] No prose sentence or multi-word human-readable label renders in
      `font-mono`; codes, IDs, counters and numeric columns still do.
- [ ] No tiny uppercase tracked eyebrow labels remain in the drill card,
      certification card, charts, or rail.
- [ ] `h1` and `h2` on the certification page differ by at least the
      documented Headline→Title step in both size and weight.
- [ ] The exam heading reads "Exam 101 Mixed" (or "Exam 101 — Mixed"), not
      "Exam 101 — Exam 101 Mixed".

## Scope (files, verified against current `main`)

Changed:

- `apps/nextjs/src/app/(public)/[cert]/page.tsx`
- `apps/nextjs/src/features/catalog/server/components/TopicMasteryPanel.tsx`
- `apps/nextjs/src/features/drill/client/components/ExplanationPanel.tsx`
- `apps/nextjs/src/features/progress/server/components/CertificationCard.tsx`
- `apps/nextjs/src/components/molecules/DoughnutChart.tsx`

Verified already compliant, left untouched:

- `apps/nextjs/src/features/catalog/server/components/ExamList.tsx` — exam
  code/count already mono, exam title already prose.
- `apps/nextjs/src/features/drill/client/components/QuestionMeta.tsx` —
  objective already mono, type label and "Nth time seen" already prose;
  the issue's original description of this file predates the current
  implementation.
- The issue's scope named `components/layout/AppRail.tsx` for the rail's
  `CERTIFICATIONS`/`PRACTICE` eyebrows; that component no longer exists —
  PR #61 replaced it with `AppSidebar.tsx`/`organisms/Sidebar.tsx`, which
  already carries no `uppercase`/`tracking-wide` labels. Nothing to change.

## Risks

- `CertificationCard`'s `<dl>` currently applies `font-mono text-xs` at the
  container level; splitting mono onto only the `<dd>` values means the
  `<dt>`/`<dd>` pair need independent classes instead of one shared
  container class — a small structural change, not just a class swap on
  existing elements.
