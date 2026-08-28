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

## `react-doctor/server-auth-actions`

- **Where:** `src/features/mailing/server/api/sendContactEmail.ts` → `sendContactEmail`
- **Why:** Public **contact form** submission. The rule's own validation prompt lists contact forms as a key false positive ("genuinely public actions — contact form, newsletter, public search"). It is _meant_ to run for anonymous callers, so an auth gate would be wrong.
- **Verify before suppressing:** the action still only sends email from
  Zod-validated (`ContactFormModel.contact`) input and performs no privileged data mutation. If it ever writes to the DB or touches user state, re-triage.
- **Not covered here (real, separate concern):** the endpoint has no
  rate-limiting / CAPTCHA — the rule's recommended defense for public actions. Track that separately; it is not an auth bug.

## `react-doctor/nextjs-no-use-search-params-without-suspense`

- **Where:** `src/app/(authorized)/layout.tsx` and `src/app/(public)/(main)/layout.tsx`, at the `<AbilityProvider>` use-site.
- **Why:** `<AbilityProvider>` (which calls `useSearchParams()`) is already
  rendered inside a `<Suspense>` boundary in the same file (the
  `<Suspense><…LayoutContent/></Suspense>` wrapper). Per the rule's validation prompt, a Suspense ancestor exists, so the layout root still renders
  statically. Adding a second, redundant boundary would be linter-appeasement.
- **Verify before suppressing:** the `<Suspense>` wrapping `…LayoutContent`
  (which renders `<AbilityProvider>`) is still present in both layouts.

## `react-doctor/only-export-components`

- **Where:** `src/components/atoms/Button.tsx` → `buttonVariants` (and any other CVA atom/organism that co-exports its `*Variants`).
- **Why:** `.claude/rules/conventions.md` **mandates** co-exporting
  `<Name>Variants` alongside the component for the CVA pattern. This is a
  deliberate, project-wide convention, so the Fast-Refresh warning is expected and accepted here. (Per `principles.md`, project conventions win over generic rules.)
- **Note:** this recurs for every CVA component. If it gets noisy, consider a team decision to `react-doctor rules disable react-doctor/only-export-components`
  (global — trades away Fast-Refresh protection for genuine util-in-component leaks).

## `react-doctor/label-has-associated-control`

- **Where:** `src/components/atoms/Label.tsx`
- **Why:** shadcn/ui **base primitive** — a reusable `<label>` wrapper whose
  `htmlFor` / nested control is supplied by consumers at each use-site, not by the primitive itself. The file already carries a matching
  `biome-ignore lint/a11y/noLabelWithoutControl: shadcn/ui base`.
- **Verify before suppressing:** consumers (e.g. `FormField`) still associate the label with a control via `htmlFor`/`id` or nesting.

## `react-doctor/nextjs-no-client-side-redirect`

- **Where:** `src/features/auth/client/providers/PermissionProvider.tsx` (the `router.replace()` inside the `useEffect` that strips `?error`).
- **Why:** This is **same-page query-param cleanup** after showing an error
  toast — it rewrites the current URL to drop a consumed `?error` param. It is not navigation to a different page, so the rule's fix (server-side
  `redirect()`) does not apply; the operation depends on client state (the toast was already shown).
- **Verify before suppressing:** it still targets `${pathname}${query}` (same path) and only removes params — if it ever navigates to a different route, re-triage.

---

## Not false positives — deliberately deferred (do NOT add here)

These remain flagged on purpose; they are open decisions, not FPs:

- `react-doctor/url-prefilled-privileged-action` — `OAuth2Start.tsx` — needs an auth open-redirect **policy** (same-origin `callbackUrl` allowlist + server-side re-check).
- `react-doctor/async-parallel` — `auth.ts:142` — the four awaits are **not** independent; `setSessionData`→`clearPKCEData` must stay sequential (documented session-write race).
- `deslop/unused-file` — `TriggerTestError.tsx` — orphaned example files kept intentionally as boilerplate starting points; delete only on a maintainer's call.
