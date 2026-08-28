---
name: codebase-atlas
description: Use when asked to build a "codebase atlas", map a repository as an interactive city, visualize a codebase's architecture as one shareable page, or update/republish an atlas that was built with this skill.
---

# Codebase Atlas

## Overview

Produce ONE self-contained interactive HTML page (no external deps; Google Fonts is the only
permitted host) that maps a repository — or several related repos as districts of one city —
as an isometric city: blocks sized by measured line counts, edges carrying animated data dots,
a left structure rail, a right WHAT IT DOES / HOW IT'S BUILT panel, and one or more end-to-end
request traces. Publish it as an Artifact.

## Iron rules

1. **Every number shown comes from a scan.** Never invent or estimate counts. Stale number →
   re-measure before editing.
2. **Every flow claim is verified in code** — especially trace entry points (which page/button
   actually starts the flow). Grep for the real call site; don't assume.
3. **Deployed services ≠ code roles.** A worker that shares another service's image is a role,
   not a building. Count code once.
4. **First run in a project: ask the user** — repo scope (mono/multi), scrub level
   (standard / aggressive / none), and whether a second locale is wanted.

## Per-project state

The atlas must outlive the session. Keep in the project (e.g. `.claude/atlas/` or `docs/atlas/`):
the HTML source, and a note recording the **artifact URL** and scrub terms. Republishing the same
file path in the same conversation keeps the URL; from any other conversation pass the recorded
URL as the Artifact tool's `url` parameter. A new file path claims a NEW url — never do that for
an update.

## Step 1 — Inventory (facts, not guesses)

Spawn one very-thorough Explore agent per repo. Ask for:

- 15–35 major subsystems: short name, 2-char code suggestion, directory/key files, 1–2
  plain-English sentences for a non-expert (STE100: active voice, short sentences), one HOW
  sentence (stack/pattern), **measured** size (`find | xargs wc -l` — exclude deps/build dirs;
  count generated code separately and label it), directed edges with what flows over each,
  notable children with their own LOC for the biggest subsystems.
- Overall request flow; databases/storage; headline stats (total LOC hand-written vs generated,
  routes, API operations, models/migrations, test files, deployed services).
- Correct your assumed subsystem list; distinguish deployed services from code roles.
- A **share-safety list**: every concrete infra identifier in tracked source a public viewer
  should not learn (bucket/queue/channel names, key namespaces, cookie names, regions, org
  handles, env-var names, internal endpoints, emails). This becomes the scrub grep list.

## Step 2 — Build

Data blocks (all rendering derives from these):

- `STRUCTURES`: id, 2-char code, name, group, measured `loc` (+`files`), grid pos `gx,gy`,
  footprint `w,d`, `what`, `how`, optional `children[]` (go-inside view), `slab:true` for storage.
  Height derives from `loc` at runtime (`~0.35*sqrt(loc/100)`, capped) — never hand-set.
- `EDGES`: `{f,t,pay}`; `flow:1` = animated dots, `dashed:1` = advisory/CI; `pay` shown when
  hovering a dot; optional `via:[[gx,gy]...]` waypoints.
- `EXTERNALS`: off-map dashed-leader boxes (identity provider, LLM/SaaS APIs, the user).
- `TRACES`: one or more, each 9–14 `[structId, sentence]` steps; give multiple traces a picker.
- Topbar stats, sidebar GROUPS, `OVERVIEW_WHAT`/`OVERVIEW_HOW` essays.
- Optional second locale: parallel dict keyed by structure id (+ payloads keyed `"F>T"`, UI
  strings, traces); default to the product's locale; persist choice in localStorage (try/catch);
  pair the Latin face with a CJK face in the font stack.

Layout rules:

- Iso projection `x=(gx-gy)*26, y=(gx+gy)*14.3 - h*16`; painter order sorts by `gx+gy`.
- Footprints disjoint; author all coords pre-scale and apply a spread factor `K≈1.35` to
  positions (not footprints) at startup so blocks get breathing room.
- Cluster by zone: browser surfaces top, API below, agent/AI right, ingestion left, core domain
  center (the eye should find it), storage slabs bottom, CI/tests in corners.
- Edges: L-elbow default; `via` only when a line cuts an unrelated cluster; lines under blocks
  are acceptable. Render the **dot layer above the block layer** so dots never vanish.
- Biggest subsystem = tallest block; storage = flat slabs.
- Start the file with `<meta charset="utf-8">` and a `<title>`; no doctype/html/head/body tags.
  Paint the body background explicitly; respect prefers-reduced-motion.

## Step 3 — Verify headlessly (mandatory)

- Playwright blocks `file://` — serve with `python3 -m http.server` (background) from the file's
  directory; kill it when done.
- Zero console errors (a local favicon 404 is expected). Via `browser_evaluate`: walk EVERY trace
  end to end checking the step sequence, exercise go-inside/back, locale toggle mid-trace if
  present, reset, and confirm dots animate.
- Screenshots only into an allowed dir; delete them afterward — never leave images in the repo.

## Step 4 — Share-safety pass (always, before the user posts it)

Keep code structure (module names, LOC, stack names, generic TTLs/limits). Scrub live-infra
facts: cloud service/queue/bucket names, endpoint paths, key prefixes/formats, credential
locations, project IDs, regions, org handles, key namespaces. Grep the final file for every term
in the inventory's share-safety list PLUS generics: the company's cloud prefix, `@` (review each
hit: CSS and public packages fine; emails/private scopes not), `secret`, `AKIA`, key prefixes,
mount paths. Zero unexplained hits or no publish. Remind the user the artifact stays private
until shared from the page menu.

## Common mistakes

| Mistake                                    | Fix                                                     |
| ------------------------------------------ | ------------------------------------------------------- |
| Guessing a trace's browser entry point     | Grep for the real UI call site first                    |
| Dot layer under blocks                     | Append dot layer after blocks                           |
| New artifact instead of update             | Recorded URL via `url` param; same file path in-session |
| Locale-A-only edits                        | Every prose edit lands in all locale dicts              |
| Local var shadowing a helper in SVG code   | Watch shadowing inside geometry functions               |
| Hardcoding heights or counts               | Heights from `loc`; counts from the scan                |
| Reset during pan animation drifts the view | Guard animations with a sequence token                  |
