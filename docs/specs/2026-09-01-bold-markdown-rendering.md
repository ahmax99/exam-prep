# Spec: Bold Markdown Rendering in Drill Content

> Status: Draft · 2026-09-01

## Problem / Context

`PromptMarkdown` (`apps/nextjs/src/features/drill/client/components/PromptMarkdown.tsx`) renders the question prompt, every answer option, and the explanation panel in the drill feature. It currently only tokenizes code spans (`` `…` ``) — it splits the input on backticks and passes everything else through as raw text. Confirmed live on https://exam-prep.ahmax99.online (desktop and mobile): seeded content uses `**…**` heavily to bold the qualifier that distinguishes the correct answer from an exam trap (e.g. "loads a kernel module **together with all its dependencies**"), and that markup reaches the DOM as literal asterisks instead of being rendered as emphasis. This isn't just a cosmetic defect — the bold text is the cue the question is designed around, so losing it removes information the user needs to answer correctly.

## Goals

- `**bold**` markdown segments in prompt, option, and explanation text render as visually bold text, with no literal asterisks shown.
- Code spans keep rendering exactly as they do today, including when they contain literal `**` inside backticks.
- The component keeps degrading gracefully on malformed/unbalanced input (e.g. a stray `*`) rather than crashing or dropping content.

## Non-Goals

- Building a general-purpose/extensible Markdown parser. Support exactly the inline syntax the seeded content actually uses today — not italics, underscores, links, headings, lists, or any block-level syntax, unless the content audit in this task turns up real usage of them.
- Changing where or how `PromptMarkdown` is invoked (prompt/option/explanation call sites are unaffected — this is an internal rendering fix).
- Changing the seed/fixture data format, the Prisma schema, or how question content is authored/stored.
- Any server-side sanitization or `dangerouslySetInnerHTML`-based rendering — the fix must keep building plain React elements.

## Requirements

### Functional

- A prompt, option, or explanation string containing `**text**` renders `text` wrapped in a bold element, with the surrounding `**` markers removed from the visible output.
- A code span containing literal asterisks — e.g. `` `**not bold**` `` — still renders the asterisks literally inside the `<code>` element; code-span tokenization must run before (or otherwise take precedence over) bold parsing, so bold markers inside a code span are never interpreted as emphasis.
- Unmatched or odd asterisk sequences (e.g. `a ** b`, a single trailing `*`) render without throwing and without silently deleting the surrounding text — the ungrouped asterisk(s) and surrounding text remain visible to the user in some reasonable literal form.
- Multiple bold segments in the same string (e.g. `**a** and **b**`) all render correctly, each independently.

### Constraints

- No `dangerouslySetInnerHTML` — output must be built as React elements, matching the component's current approach. If an external library is used instead of hand-rolled parsing, it must be an inline-only renderer with HTML output disabled.
- Fix lands in `apps/nextjs/src/features/drill/client/components/PromptMarkdown.tsx`; since this component is the single rendering path for prompt, option, and explanation text, one fix covers all three surfaces.
- Before finalizing the supported syntax set, check the seeded question content (fixtures under `apps/nextjs/prisma/fixtures/`, and any other content source in use) for other inline markdown actually present (`*italic*`, `_underscore_`, links) and extend scope only if real usage is found there.
- Follow this repo's existing component conventions (`.claude/rules/conventions.md`): named export, `data-slot` on the root element already present, no unnecessary `'use client'` addition (this is a plain function component, not currently client-marked).

## Affected Areas

- [x] `apps/nextjs` (`features/drill/client/components/PromptMarkdown.tsx`)
- [ ] `apps/nextjs/prisma` (schema/migration) — not applicable, no schema change

## Acceptance Criteria

- [ ] A prompt containing `**text**` renders `text` in bold, with no asterisks visible in the rendered output.
- [ ] The same holds for answer option text rendered through `PromptMarkdown`.
- [ ] The same holds for the explanation panel rendered through `PromptMarkdown`.
- [ ] `` `**literal**` `` inside a code span still renders the asterisks literally (i.e. code-span content is never re-parsed for bold).
- [ ] Unmatched/odd asterisks (e.g. `a ** b`) do not crash the component and do not silently swallow the surrounding text.
- [ ] No `dangerouslySetInnerHTML` is introduced anywhere in the changed code.
- [ ] `bun run check-types` and `bun run check-format` pass on the changed file.

## Open Questions / Risks

- The committed fixture (`apps/nextjs/prisma/fixtures/sample.json`) checked during this spec contains **no** `**bold**`, `_underscore_`, `*italic*`, or `[link](url)` usage today — the bold markdown observed live comes from content seeded separately (e.g. via the `quiz-generator` skill output or a larger content bank) that isn't present in this repo checkout. This spec proceeds on the issue's own confirmed live evidence for `**bold**` usage; the `/plan` and `/implement` phases should still re-check whatever fixture/content file the implementation step actually verifies against, and add a `**bold**` case to that fixture if none exists, so the fix has a real regression case to run against in this repo.
- No other inline markdown syntax (italics, underscores-as-emphasis, links) was found in the checked fixture, so this spec scopes the fix to bold only, per the issue's own "support exactly what the content contains" guidance. If `/plan` or `/implement` finds such usage in a fuller content source, that's new scope to raise, not silently fold in here.
- Whether to hand-roll the bold tokenizer (extending the existing regex-split approach) or pull in a minimal inline-Markdown library is an implementation choice left to `/plan` — both are compatible with the constraints above.
