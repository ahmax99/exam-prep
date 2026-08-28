# React Doctor — false positives

Diagnostics confirmed as false positives for this codebase. The `/doctor` local triage playbook reads this file in **Step 2 (Filter)** and drops any matching diagnostic before triage, so these don't get re-litigated on every run.

> Scope: this file governs the **local triage agent** only. It does **not** change
> the CLI score or the CI health snapshot (`react-doctor.yml`). To keep a rule
> active everywhere but hide a single confirmed site from the score/CI, add an
> inline disable at that site instead (react-doctor respects inline disables by
> default; audit them with `react-doctor --no-respect-inline-disables`).

Each entry: **rule** — **where / code shape** — **why it's a false positive**.
Entries that say _"verify"_ require an actual Read/grep of the current code before suppressing — never suppress on filename alone.

---

## `react-doctor/only-export-components`

- **Where:** `src/components/atoms/Button.tsx` → `buttonVariants` (and any other CVA atom/organism that co-exports its `*Variants`).
- **Why:** `.claude/rules/conventions.md` **mandates** co-exporting
  `<Name>Variants` alongside the component for the CVA pattern. This is a
  deliberate, project-wide convention, so the Fast-Refresh warning is expected and accepted here. (Per `principles.md`, project conventions win over generic rules.)
- **Note:** this recurs for every CVA component. If it gets noisy, consider a team decision to `react-doctor rules disable react-doctor/only-export-components`
  (global — trades away Fast-Refresh protection for genuine util-in-component leaks).

---

## Not false positives — deliberately deferred (do NOT add here)

These remain flagged on purpose; they are open decisions, not FPs:

- `deslop/unused-file` — `TriggerTestError.tsx` — orphaned example file kept intentionally as a boilerplate starting point; delete only on a maintainer's call.
