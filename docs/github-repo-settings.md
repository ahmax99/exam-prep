# GitHub Repository Settings

## Merge settings

| Setting                     | Value                                       |
| --------------------------- | ------------------------------------------- |
| Squash merge                | Allowed (default merge method)              |
| Merge commit                | Disabled                                    |
| Rebase merge                | Disabled                                    |
| Auto-merge                  | Allowed                                     |
| Delete branch on merge      | Enabled                                     |
| Update branch (suggest)     | Allowed                                     |
| Squash commit message       | Commit messages                             |
| Squash commit title         | Commit or PR title (not forced to PR title) |
| Web commit signoff required | No                                          |

Only squash merging is allowed onto `main`, keeping one commit per PR — consistent with the `chore(main): release` / conventional-commit style seen in the git log.

## Branch protection on `main`

Two overlapping mechanisms are both active — a legacy branch protection rule and a newer ruleset. GitHub applies the union of both.

**Legacy branch protection** (`branches/main/protection`):

| Rule                             | Value                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Required status checks           | Strict (must be up to date), but **no contexts configured**                                                  |
| Required PR reviews              | Enabled, `required_approving_review_count: 0`, dismiss stale reviews on push, code owner review not required |
| Enforce for admins               | Yes                                                                                                          |
| Required signatures              | No                                                                                                           |
| Linear history required          | No                                                                                                           |
| Allow force pushes               | No                                                                                                           |
| Allow deletions                  | No                                                                                                           |
| Conversation resolution required | No                                                                                                           |

**Ruleset `main`** (id `17742442`, target: branch, applies to `~DEFAULT_BRANCH`, enforcement: active):

- `deletion` — blocks branch deletion
- `required_linear_history` — blocks merge commits landing on the branch
- `non_fast_forward` — blocks force pushes
- No bypass actors (`current_user_can_bypass: never`)

**Net effect:** no one can force-push, delete, or merge-commit onto `main`, and admins are not exempt. PRs require a review to open, but the required-approving-review-count is 0 and no status-check contexts are pinned — the actual quality bar comes from `.claude/rules/harness.md`'s `/qa` reviewers and CI (SonarQube, security.yml, etc.) rather than a hard-blocking required check. Worth deciding deliberately whether to wire `required_status_checks.contexts` to the CI jobs that must pass (e.g. `check-types`, `security`) — right now a red CI run doesn't structurally block a merge.

## Environments

| Environment | Required reviewers                                          | Deployment branch policy | Admin bypass |
| ----------- | ----------------------------------------------------------- | ------------------------ | ------------ |
| `dev`       | None                                                        | None (no restriction)    | Yes          |
| `prod`      | `ahmax99` (required reviewer, `prevent_self_review: false`) | None (no restriction)    | Yes          |

Neither environment restricts which branches/tags can deploy to it at the GitHub level — that gating is done in workflow `if:` conditions instead (see `deployment-environments.md`). The approval flow prod's reviewer triggers is covered there too; this table is just the current GitHub-side config.

## Actions permissions

| Setting                                       | Value                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Actions enabled                               | Yes                                                                                                                |
| Allowed actions                               | All actions and reusable workflows (not restricted to verified/local)                                              |
| SHA pinning required (org-level enforcement)  | No (`sha_pinning_required: false`) — pinning is a repo convention (`cicd-reviewer`), not a GitHub-enforced setting |
| Default workflow permissions (`GITHUB_TOKEN`) | Read-only                                                                                                          |
| Workflows can approve PRs                     | Yes (`can_approve_pull_request_reviews: true`)                                                                     |

Default token permissions are read-only, so every workflow job that needs to write (comment on a PR, push a tag, call the GitHub API) must explicitly declare `permissions:` — this is the least-privilege baseline `cicd-reviewer` checks against. `allowed_actions: all` means any public action can be used; nothing here structurally blocks an unpinned or untrusted action — that's enforced by review convention + `zizmor`, not a repo setting.

## Security & analysis

| Feature                                                    | Status                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Secret scanning                                            | Enabled                                                                                               |
| Secret scanning push protection                            | Enabled                                                                                               |
| Secret scanning non-provider patterns                      | Disabled                                                                                              |
| Secret scanning validity checks                            | Disabled                                                                                              |
| Dependabot security updates (auto-PRs for vulnerable deps) | Disabled                                                                                              |
| Dependabot version updates                                 | Enabled via `.github/dependabot.yml` — weekly, `bun` ecosystem + `github-actions`, both rooted at `/` |
| Dependabot alerts                                          | Enabled (`vulnerability-alerts` → 204)                                                                |
| Automated security fixes                                   | Disabled                                                                                              |

Push protection catches secrets before they land in a commit, on top of the local `gitleaks` Lefthook hook — belt and suspenders. Dependabot _alerts_ are on (you'll see advisories) but _security updates_ (auto-generated fix PRs) are off; version-update PRs still flow weekly from `dependabot.yml` for both ecosystems.

## Webhooks, deploy keys, autolinks

All empty — no repo-level webhooks, no SSH deploy keys, no issue/PR autolink references configured. GitHub App integration (the automation bot) is installed at a scope this token can't introspect (`installations` endpoint 404s for a repo-scoped read), not via a classic webhook.
