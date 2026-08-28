# Deployment Environments

This document covers the two GitHub Actions environments (`dev` and `prod`) — their triggers, the pipeline flow between them, and the per-environment hardening. For the step-by-step bring-up (prerequisites, GitHub variable/secret tables, first applies), see [`runbook.md`](runbook.md).

## Overview

| Environment | Trigger                                                                                                                                                                                                                                                                                                   | Approval                                       | AWS account         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------- |
| `dev`       | Push to `main` — one workflow, `deploy.yml`, paths-filtered over app **and** `infra/**` paths. `apply-dev`/`deploy-dev-*` run when their respective `detect` output is `true`. Also reachable via `workflow_dispatch` on a branch, with `scope: infra-only` / `apps-only` to run just one half            | None                                           | Dev member account  |
| `prod`      | `v*` tag pushes — `deploy.yml`'s `apply-prod` and prod deploy jobs all key off `ref_type`/`ref_name`. Also reachable via `workflow_dispatch` **against a tag ref** (`scope: apps-only` re-deploys a shipped release), or against a branch with `apply_prod: true` (first bring-up only — see the runbook) | Required reviewer (see "Prod approvals" below) | Prod member account |

**dev and prod are dedicated AWS accounts** (member accounts under a shared AWS Organization, managed by the [org repo](https://github.com/ahmax99/ahmax99-aws-org)) — the account boundary, not just the resource-name prefix, is the isolation mechanism. A third **shared-services** account hosts the two org-wide resources both environments depend on: the Route 53 apex zone and the **central ECR registry**. Account-level plumbing — the GitHub OIDC providers, per-account `gha-deploy` roles, the `gha-ecr-push` role, the `dns-apex-manager` role, DNS zones and delegation, and the ECR repositories themselves — is owned by the org repo, not this one; this repo's Terraform manages only the app infrastructure inside each environment account.

PRs touching `infra/**` get an automatic `terraform plan` comment (dev) via `terraform-plan.yml`.

**Prod approvals.** `apply-prod`, `deploy-prod-backend`, and `deploy-prod-frontend` all run under `environment: prod` in the same `deploy.yml` run, with ordering enforced by `needs: apply-prod` + an explicit `result == 'success'` check (not a separate cross-workflow wait). Whether GitHub raises one reviewer prompt per run+environment or one per gated job is to be confirmed on the first release after this pipeline collapsed from two workflows into one — previously it was two prompts (once for the Terraform apply, once for the app deploy); it may now be one. Either way, ordering safety doesn't depend on the prompt count.

## Ordering invariants

The pipeline's guarantees, and the mechanism behind each — change one, check you haven't broken another:

| Invariant                                                            | Mechanism                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A branch push deploys **dev only**; a `v*` tag deploys **prod only** | `ref_type` guards on the deploy jobs. Path filters don't apply to tag pushes, so a release tag runs whatever it touched — keying on `ref_type` is what stops a same-commit double-deploy                                                                                             |
| Terraform lands before the app, per environment                      | `deploy-dev-*` needs `apply-dev`; `deploy-prod-*` needs `apply-prod` — a native `needs:` edge plus an explicit `result == 'success'` check, which also subsumes the old "assert the specific job, not the run" requirement now that both jobs live in the same run                   |
| Schema migrates before the app, per environment                      | `deploy-dev-backend` needs `migrate-dev`; `deploy-prod-backend` needs `migrate-prod` — same `needs:` + tolerant `result == 'success' \|\| 'skipped'` pattern as the Terraform-ordering row above, so a pending Prisma migration always lands before the backend code that expects it |
| One CodeDeploy deployment at a time per target                       | Job-level `concurrency: deploy-target-<env>-<app>` — keyed on the target, not the ref, so runs in different workflow concurrency groups still serialize                                                                                                                              |
| One `terraform apply` at a time per state file                       | Job-level `concurrency: terraform-state-<env>` on each apply job (a tag run applies dev _and_ prod, so a ref-keyed group can't express this)                                                                                                                                         |
| Backend before frontend, per environment                             | `deploy-dev-frontend` needs `deploy-dev-backend`; `deploy-prod-frontend` needs `deploy-prod-backend` — a push/release may add API surface the new UI calls                                                                                                                           |
| Static assets are in S3 before traffic shifts to the new frontend    | The `deploy-static-assets` step runs **before** `deploy-lambda`, and both syncs are additive (no `--delete`, so the live version keeps its own assets)                                                                                                                               |
| A deploy is never interrupted                                        | `cancel-in-progress: false` — cancelling the run wouldn't stop the AWS-side deployment, it would just orphan it and block the next one                                                                                                                                               |
| Prod never deploys on top of a currently-broken dev                  | `verify-dev-healthy` — since dev isn't redeployed by a release, this checks the most recent relevant `deploy.yml` dev-deploy run on `main` actually succeeded (fails open only if no such run exists yet)                                                                            |
| Dev's Terraform isn't reapplied by a release tag                     | `apply-dev`'s `if` gates on `detect.outputs.infra` (always `false` for a tag push) and requires `workflow_dispatch` or a branch push; `apply-prod`'s `if` explicitly tolerates a skipped `apply-dev` (`needs.apply-dev.result == 'skipped'`)                                         |
| A dispatch can run just the infra half or just the app half          | `workflow_dispatch`'s `scope` input (`infra-and-apps` / `infra-only` / `apps-only`), folded into `detect`'s outputs so no other job's `if:` needs to know about it                                                                                                                   |

`apply-dev`/`apply-prod` and the deploy jobs now live in **one** workflow run (`deploy.yml`), so the ordering above is an ordinary same-run `needs:` edge rather than one workflow polling another's run history.

Known residual: because branch-push runs of `deploy.yml` share one workflow-level concurrency group (`deploy-dev`), a dev app deploy and a dev Terraform apply from different pushes now serialize by construction — the race the old two-workflow model couldn't close. The residual that remains: with `cancel-in-progress: false`, GitHub keeps at most one _pending_ run per group, so a third rapid push supersedes (cancels) the second push's pending run. That's latest-wins on a converging deploy target — the superseded commit's code is contained in the newer run — and `check-last-dev-deploy.sh` treats a `cancelled` job the same as `skipped` so it doesn't misread that as a broken dev.

## Central ECR (build once, deploy everywhere)

The frontend and backend images are built **once** per commit/tag and pushed into the central ECR repositories in the shared-services account (`<project>-backend` / `<project>-frontend` — env-agnostic names), tagged `:<tag>` and `:latest`. The build jobs assume the org-provided `gha-ecr-push` role directly — they carry no GitHub `environment:` and touch neither app account.

Both environments then deploy the **same image URI**: the repos' resource policy grants pull to any principal in the AWS Organization (`aws:PrincipalOrgID`), plus the Lambda service principal for cross-account function image pulls (see the runbook's prerequisites). There is **no image promotion step** — prod deploys the exact URI the build job produced, so digest identity between dev and prod is structural rather than enforced by a copy step.

Image URLs are never configured by hand: workflows derive them from `vars.CENTRAL_ECR_ACCOUNT_ID` + the repo name (`deploy.yml`'s `ECR_REGISTRY` env), and Terraform derives the same URLs from `var.central_ecr_account_id` (`infra/locals.tf`), so the two can't drift.

`NEXT_PUBLIC_*` values are **not** part of the build: the frontend Docker image takes no `NEXT_PUBLIC_*` build-arg (see `.claude/rules/architecture.md`'s "build once, deploy many" rule); any config the browser needs at runtime (e.g. the Sentry DSN) is fetched from a runtime `/api/config` route, not baked into the image.

## DNS

The apex zone (`<root_domain>`) lives in shared-services. The org repo delegates `dev.<root_domain>` into the dev account, where this repo's dev apply writes its records (`<project>.dev.<root_domain>`) directly — same-account, no cross-account role. Prod's records (`<project>.<root_domain>`) go into the apex zone itself, written cross-account through the org-provided `dns-apex-manager` role, which Terraform assumes via the `aws.dns` provider alias (`vars.DNS_ACCOUNT_ROLE_ARN` → `TF_VAR_dns_account_role_arn`; empty on dev, where `aws.dns` degrades to the ambient credentials).

## Pipeline Flow

### Day-to-day development (branch push to `main`)

```
push to main (paths match)
  └── detect (affected apps, infra changed?)
        ├── apply-dev (if infra/** changed)
        ├── build-backend (if affected)
        └── build-frontend (if affected)

  apply-dev ──→ migrate-dev (if backend affected — runs `prisma migrate deploy`)
  apply-dev + build-backend + migrate-dev ──→ deploy-dev-backend
                                      └──→ deploy-dev-frontend (also needs apply-dev + build-frontend)
                                            (assets → S3, then Lambda)
```

Prod is not touched. `IMAGE_TAG` = commit SHA. `apply-dev` runs on this push if `infra/**` changed (skipped otherwise); `deploy-dev-backend`/`deploy-dev-frontend` both `needs: apply-dev` and tolerate it being skipped, so infra lands before the app whenever there's infra to apply, same as the release flow gives prod via `apply-prod`. `migrate-dev` runs whenever `detect.outputs.backend` is `true` (which turbo's affected-package graph already sets for a `shared/neon/**`-only change, since `backend-boilerplate` depends on `@shared/neon`), and `deploy-dev-backend` needs it the same tolerant way it needs `apply-dev`. `deploy-dev-frontend` also `needs: deploy-dev-backend` (tolerating a skip the same way) — a push may add API surface the new frontend calls, the same reasoning that already ordered prod's backend before its frontend.

### Release (tag push `v*`)

```
release-please merges Release PR → creates tag v1.2.3
  └── deploy.yml:
        detect (both apps — a new tag has no diff base; infra=false, apply-dev skipped)
          ├── build-backend ─────────┐
          ├── build-frontend ────────┤
          └── verify-dev-healthy ────┤
                                     └──→ [prod reviewer gate] ──→ apply-prod
                                                                     └──→ migrate-prod (if backend affected)
                                                                            └──→ [prod reviewer gate] ──→ deploy-prod-backend
                                                                                                              └──→ deploy-prod-frontend
```

**A release moves prod only.** The tagged commit already reached dev from the branch push that carried it, so re-deploying dev here would only add redundant bakes to the release critical path and a second writer on the dev Lambdas/state — both `deploy-dev-*` and `apply-dev` are gated to branch pushes (and, for `apply-dev`, `workflow_dispatch`, which bring-up and ad-hoc dev reapplies still use on any ref). `apply-dev` is skipped on a tag push (`detect.outputs.infra` is always `false` for a tag), and `apply-prod`'s `if` explicitly tolerates that skip.

Dropping the dev _redeploy_ still leaves a real question: was the dev deployment that already happened for this code actually healthy? A release commit's own push to `main` never runs `deploy.yml` in the first place — its only changes (`CHANGELOG.md`, `.release-please-manifest.json`) don't match `deploy.yml`'s `paths` filter — so there's no exact-commit dev run to point at. `verify-dev-healthy` is the substitute: it scans back through recent completed `deploy.yml` runs on `main` for the most recent one that actually ran the relevant `Deploy Backend → Dev` / `Deploy Frontend → Dev` job (skipping runs where that job itself didn't run because the app wasn't affected, or was cancelled by a later superseding push) and requires it to have succeeded. It fails open (logs a warning, doesn't block) only if no such run exists in recent history at all.

Both environments deploy the **same central-registry image URI** — built once, no per-environment copy. `IMAGE_TAG` = `v1.2.3`. `apply-prod` and the prod deploy jobs all trigger off the same tag push in the same `deploy.yml` run; `deploy-prod-*` needs `apply-prod`, so infra always lands before the app.

Dispatching `deploy.yml` **on an existing tag** with `scope: apps-only` (a re-deploy of a shipped release) skips `apply-prod` outright — `inputs.scope != 'apps-only'` is one of `apply-prod`'s own guard clauses — and the prod deploy jobs accept that skip only for `workflow_dispatch`, never for a push.

### Hotfix

```
hotfix/* branch → merge to main → manually trigger release-please.yml (workflow_dispatch)
  → release-please creates patch tag v1.2.x
  → tag triggers the release pipeline above
```

## Release automation

`release-please.yml` and `auto-merge.yml` create commits, PR merges, and tags
on `main` — all of which are the exact events that trigger `deploy.yml`.
GitHub Actions has a deliberate anti-recursion rule for this:
_"events triggered by the `GITHUB_TOKEN` will not create a new workflow run,
even when the repository contains a workflow configured to run when `push`
events occur"_ (GitHub Actions docs). Two places in this pipeline hit that rule,
and each needed a different fix:

- **Merging the release PR.** `auto-merge.yml` used to auto-merge
  `release-please`'s PR on approval using `GITHUB_TOKEN`. That merge is a push
  to `main`, so it never re-triggered `release-please.yml` itself — the tag
  was never cut. Fix: that job was removed. A human now merges the release PR
  by hand (after approving it) — a merge from a real account is a normal push
  event, so `release-please.yml` runs immediately afterward.
- **Creating the release tag.** `release-please.yml` still needs to create the
  `v*` tag (and the GitHub Release) itself, and doing that with `GITHUB_TOKEN`
  hits the same rule — the tag push wouldn't trigger `deploy.yml`. Fix: it
  authenticates as a **GitHub App** installation instead
  (minted per-run via `actions/create-github-app-token`, short-lived and
  scoped to just this repo's `contents`/`pull-requests` permissions) —
  preferred over a long-lived PAT for the same reason this repo avoids static
  AWS keys elsewhere (see `.claude/rules/infra.md`). See
  [`runbook.md`'s prerequisite 5](runbook.md#5-release-automation-github-app-repo-level-one-time)
  for how to create and install that App.

Net effect: a release PR still needs a human to click merge, but from there
the tag, the prod Terraform apply, and the prod app deploy all cascade
automatically, same as before these fixes.

## Maintenance mode

`toggle-maintenance.yml` (`workflow_dispatch`, pick `environment` + `enabled`) is
a manual cost switch for an environment that won't be used for a while: it
routes CloudFront to a static "down for maintenance" page instead of the
Lambda origins, **deletes** the WAF web ACL (AWS bills a web ACL for existing,
not for being attached, so detaching alone doesn't save anything), and zeroes
provisioned concurrency. All driven by one Terraform variable,
`maintenance_mode` (`TF_VAR_maintenance_mode`), so there's no separate
maintenance-mode infrastructure to keep in sync.

Two jobs, in order: **apply** (`terraform apply` with `maintenance_mode` set
from the workflow's `enabled` input, then a verify step that checks the edge
is actually serving the expected mode before anything else proceeds) →
**record** (persists the result as the `MAINTENANCE_MODE` environment
variable, via the same Automation GitHub App used for release automation, so
the _next_ regular `apply-dev`/`apply-prod` run in `deploy.yml` reads it back
and doesn't accidentally revert the environment out of maintenance mode).
`apply` runs under `environment: <target>`, so toggling prod needs the same
reviewer approval `deploy.yml`'s prod-gated jobs already require — one
approval, not two, since the apply-and-verify steps now share a single job
instead of being split across two environment-gated jobs.

`apply`'s job-level `concurrency` group is `terraform-state-<env>` — the same
group `deploy.yml`'s `apply-dev`/`apply-prod` jobs use — so a manual toggle
and a regular pipeline apply serialize on the same state file instead of
racing. This used to be a real gap: the workflow keyed its own group on its
own name (`terraform-apply-<env>`) rather than the state file it touches, so a
toggle could run concurrently with an unrelated `apply-dev`/`apply-prod` and
corrupt the shared S3 state.

One wrinkle the `apply` job handles for you: Terraform schedules the web ACL's
destroy _before_ the CloudFront update that detaches it (`module.waf`'s count
drops to 0, and the cross-module output edge inverts the ordering), so
`DeleteWebACL` would always fail with `WAFAssociatedItemException`.
`.github/scripts/terraform-apply-retry.sh` therefore inspects the plan and, when
it sees the ACL being deleted, clears the distribution's `WebACLId` via the AWS
CLI and waits for that to deploy before applying.

Turning maintenance mode back off is the same workflow with `enabled: false`.

## OIDC Roles

GitHub→AWS authentication uses the OIDC **providers** the org repo creates in each member account. The account-level roles (below) are org-owned; the one app-specific role, `gha-app-deploy`, is created by **this repo's own Terraform** against that provider. Each role is scoped to the least privilege its step needs:

- **`gha-ecr-push`** (shared-services, _org-owned_): assumed by the build jobs from any ref; push/pull scoped to the shared-services registry only. Read into the workflows as repo-level `vars.ECR_PUSH_ROLE_ARN`.
- **`gha-plan`** (dev, read-only, _org-owned_): assumed by the PR `terraform plan` job (`vars.TF_PLAN_ROLE_ARN`, repo-level — plans only run against dev). `ReadOnlyAccess` plus a scoped `secretsmanager:GetSecretValue` on the dev project secrets (plan refreshes the secret-version resources, which `ReadOnlyAccess` alone can't read) — no write/apply, so a tampered PR can't mutate state or resources; the plan runs `-lock=false` because the role can't write the S3-native lock.
- **`gha-deploy`** (dev / prod, admin, _org-owned_): assumed by `deploy.yml`'s `apply-dev`/`apply-prod` jobs (`vars.TF_APPLY_ROLE_ARN` per env). Broad by necessity — Terraform manages the whole account's app infra. The prod role's trust requires the `environment:prod` OIDC subject claim, so only the reviewer-gated `prod` environment can assume it.
- **`gha-app-deploy`** (dev / prod, scoped, _created by this repo_): assumed by `deploy.yml`'s app deploy jobs (`vars.APP_DEPLOY_ROLE_ARN` per env). This repo's `modules/github-deploy-role` creates it against the org-provided OIDC provider (discovered via a `data` lookup) and scopes its inline policy to the **exact ARNs** of the Lambda functions, CodeDeploy apps, static-assets bucket, CloudFront distribution, and ECR repos this Terraform manages — tighter than a name wildcard, and owned next to the resources it grants. The prod role's trust requires the `environment:prod` claim.

Trust policies pin the **numeric** GitHub org/repo IDs (immutable subject claims), so renamed or recreated repos don't inherit access — the org roles from the org repo's variables, and `gha-app-deploy` from `TF_VAR_github_org*`/`_repo_id`, which CI supplies from the Actions context.

## Per-Environment Hardening (`local.env_config`)

Prod runs a hardened configuration while dev stays cheap. All the differences live in **one** place — the `env_config` map in `infra/locals.tf`, keyed on `var.environment`. It resolves purely from `var.environment` (which CI sets via `TF_VAR_environment`), so it works with **no `-var-file`** — CI never passes one at all (`terraform-plan.yml` / `deploy.yml`'s apply jobs call `plan`/`apply` with no `-var-file` flag); every CI-supplied variable comes from the whitelist of `TF_VAR_*` exported by `terraform-env`. To tune a per-environment value, edit that map — nothing else.

This is deliberately a `locals` map, not a `variable` sourced from `vars/*.tfvars`. The `vars/*.tfvars` files (and their `TF_VAR_*` CI counterparts) exist for values a human must externally supply per environment — secrets, external resource IDs (Neon DB URL, Google OAuth client, Resend key, Sentry DSN), cross-account identifiers (`central_ecr_account_id`, `dns_account_role_arn`) — things Terraform can't derive on its own. The hardening knobs here (log retention, concurrency, deployment strategy, alarm toggle) are internal policy that Terraform derives entirely from `var.environment`; making them `variable`s would mean also adding them to `terraform-env`, both workflows, and both GitHub environments' UI for no operational benefit. See `.claude/rules/infra.md` for the full rule.

| Key                                 | `dev`              | `prod`                           | Effect                                                                                                                        |
| ----------------------------------- | ------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `log_retention_days`                | `7`                | `30`                             | CloudWatch Lambda log retention                                                                                               |
| `reserved_concurrent_executions`    | `-1` (unreserved)  | `10`                             | Caps prod blast radius / cost; bounds each function's share of the account concurrency pool                                   |
| `provisioned_concurrent_executions` | `0` (off, no cost) | `2`                              | Pre-warmed Lambda envs on the alias to eliminate cold starts (prod only)                                                      |
| `deployment_config_name`            | `…LambdaAllAtOnce` | `…LambdaCanary10Percent5Minutes` | Prod shifts 10% of traffic first and watches alarms before going to 100%                                                      |
| `enable_alarms`                     | `false`            | `true`                           | Gates the `monitoring` module (`count`) so dev creates zero alarm resources                                                   |
| `cognito_deletion_protection`       | `"INACTIVE"`       | `"ACTIVE"`                       | Dev's user pool can be torn down freely; prod's requires deliberately flipping this before `terraform destroy` can remove it. |
| `s3_logs_expiration_days`           | `7`                | `90`                             | Access-log objects (CloudFront + S3) in the shared logs bucket self-delete after this many days                               |

**Safe prod deploys.** In prod, CodeDeploy shifts traffic gradually and monitors CloudWatch alarms; if the new version errors, it auto-rolls-back (`DEPLOYMENT_STOP_ON_ALARM`, already in `auto_rollback_events`). The `modules/monitoring` module creates four alarms per release target — `Errors` and `Throttles` on the backend and frontend Lambda **aliases** — and CodeDeploy consumes their names via `alarm_names`. These alarms exist to **gate the deployment**, not to page a human: there is intentionally **no SNS topic**. Human error alerting stays on **Sentry** (app-side). CloudWatch still earns its place because CodeDeploy can only read CloudWatch alarms (not Sentry), and `Throttles` / init-crashes / timeouts never reach the app-level Sentry SDK — `Throttles` especially matters now that prod caps reserved concurrency. If you later want proactive push alerts for those platform-level signals, add an SNS topic (with a **customer-managed** KMS key — CloudWatch cannot publish to a topic encrypted with the AWS-managed `alias/aws/sns` key) and wire it into the alarms' `alarm_actions`.

## Rollback

Automatic rollback exists at exactly one layer — the CodeDeploy blue/green swap — and stops there. Everything before and after it in the pipeline is forward-only.

**What rolls back automatically.** This is the "Safe prod deploys" behavior above: `auto_rollback_configuration` (`infra/modules/codedeploy`) reverts a Lambda alias to its previous version on `DEPLOYMENT_FAILURE`, or — in prod only, since `enable_alarms` is `false` in dev — on `DEPLOYMENT_STOP_ON_ALARM` during the canary window. Dev's `LambdaAllAtOnce` config with no alarms wired in means a bad dev deploy has no automatic net; that's deliberate, dev is meant to fail loud rather than quietly roll back.

**What does not roll back:**

- **Terraform (`apply-dev`/`apply-prod`).** A `terraform apply` is never reverted if a later job in the same run fails — the applied infra stays applied. This is ordinary Terraform behavior, not a gap specific to this pipeline: an automatic revert-apply can itself fail, or destroy something with live data. Recovery is a forward fix (a new PR/commit correcting the config), not an automatic revert.
- **Database migrations (`migrate-dev`/`migrate-prod`).** `prisma migrate deploy` applies pending migrations and has no automatic "down." If it succeeds and a later job in the same run fails — including a CodeDeploy auto-rollback of the Lambda code that ran right after it — the schema stays on the new version while the _old_ code (now back in front of traffic) is what's actually running. This is why every migration in this repo must be **expand/contract**: additive and backward-compatible (new nullable columns, new tables, dual-write) for at least one full release, with any drop/rename of the old shape deferred to a follow-up migration once nothing references it. A migration that isn't safe for the previous release's code to run against — not the absence of a schema-rollback step — is what actually causes an incident here.

**Recovering from a bad prod release** is manual and forward-only:

1. If the Lambda deploy itself failed or tripped an alarm, CodeDeploy has already reverted the alias — `deploy-lambda.sh` prints the deployment's `errorInformation` on failure; check that or `aws deploy get-deployment` for what happened.
2. If the release is otherwise bad (a logic bug the alarms didn't catch), re-run `deploy.yml` via `workflow_dispatch` **on the previous `v*` tag** with `scope: apps-only` — no rebuild needed (that tag's image already exists in the central registry), and it redeploys the last-known-good image through the same reviewer-gated, alarm-monitored CodeDeploy path. `migrate-prod` runs again on that re-dispatch too; it's a no-op since `prisma migrate deploy` only applies pending migrations.
3. If a migration needs correcting, ship a new forward migration (never edit or delete one already applied) and let the next release carry it through `migrate-prod` the normal way.

There is deliberately no "roll back the database" step — see the expand/contract note above.

## Setup

Bring-up of a new environment — prerequisites, the GitHub variable/secret tables, state-bucket creation, first applies, and the release flow — is documented step by step in [`runbook.md`](runbook.md).
