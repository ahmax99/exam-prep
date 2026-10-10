# Deployment Environment

This repo manages a single GitHub Actions environment, `prod` — its trigger, the pipeline flow, and its hardening. For the step-by-step bring-up (prerequisites, GitHub variable/secret tables, first apply), see [`runbook.md`](runbook.md).

## Overview

Two independent things happen on a push to `main`, and neither waits on the other:

| Trigger                            | What runs                                                   | Approval                                       |
| ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Push to `main` touching `infra/**` | `deploy.yml`'s `apply` job — `terraform apply` against prod | Required reviewer (see "Prod approvals" below) |
| Push to `main` touching the app    | **Vercel's GitHub App** — outside GitHub Actions entirely   | None — Vercel deploys on push directly         |

**Prod is a dedicated AWS account** (a member account under a shared AWS Organization, managed by the [org repo](https://github.com/ahmax99/ahmax99-aws-org)) — the account boundary, not just the resource-name prefix, is the isolation mechanism. Account-level plumbing — the GitHub OIDC provider, the `gha-plan`/`gha-deploy` roles, and the cross-account DNS role for the apex zone — is owned by the org repo, not this one; this repo's Terraform manages only the app infrastructure inside the prod account.

PRs touching `infra/**` get an automatic `terraform plan` comment via `terraform-plan.yml`. That job deliberately carries **no** `environment:` — a read-only, PR-time plan must not be gated behind prod's required-reviewer rule — so its `TF_VAR_*` inputs are repo-level secrets/variables rather than environment-scoped ones (see the runbook's GitHub configuration reference).

**Prod approvals.** `deploy.yml`'s `apply` job runs under `environment: prod`, so a push to `main` touching `infra/**` prompts the required reviewer before Terraform applies. **App deploys carry no such gate** — Vercel's GitHub App builds directly off the push, independent of GitHub's environment protection rules. This is a deliberate trade for simplicity: there is no reviewer step, no CI job, and no AWS role assumption between a push and the app going live.

## Ordering invariants

| Invariant                                                                                                                                                                                                                                      | Mechanism                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One `terraform apply` at a time per state file                                                                                                                                                                                                 | Job-level `concurrency: terraform-state-prod` on `deploy.yml`'s `apply` job (also used by `destroy.yml`, so a teardown can never race a regular apply) |
| A Terraform apply is never interrupted                                                                                                                                                                                                         | `cancel-in-progress: false` — cancelling the run wouldn't stop the AWS-side apply, it would just orphan it and block the next one                      |
| The database schema always lands before the app that expects it `apps/nextjs/vercel.json`'s build command runs `prisma migrate deploy && next build` — a failed migration fails the deployment, enforced by Vercel's build, not GitHub Actions |
| Infra changes and app deploys never block each other                                                                                                                                                                                           | They are two independent triggers (Terraform via GitHub Actions, the app via Vercel's GitHub App) with no `needs:` edge between them                   |

## DNS

The apex zone (`<root_domain>`) can live in a different AWS account. Prod's records (`<project>.<root_domain>` → Vercel, added with the Vercel module) are written into that zone through the org-provided cross-account role, which Terraform assumes via the `aws.dns` provider alias (`vars.DNS_ACCOUNT_ROLE_ARN` → `TF_VAR_dns_account_role_arn`).

## Pipeline flow

```
push to main, infra/** changed
  └── deploy.yml: detect → apply                                          [prod reviewer gate]

push to main, app changed
  └── Vercel GitHub App (outside GitHub Actions):
        bun install → prisma migrate deploy → next build → deploy
```

`detect` is a single inline step in `deploy.yml` — it diffs the push range for `infra/**` and the pipeline's own definition (`.github/workflows/deploy.yml`, `.github/actions/**`, `.github/scripts/**`), and a `workflow_dispatch` always applies. On a first push or force-push, where no usable base commit exists, it fails safe by applying.

## Release automation

There is **no release-automation workflow** in this repo (no release-please, no changelog generation, no version tags) — every commit that lands on `main` is its own unit of deployment. This is a deliberate simplification for a single-environment pipeline: a release tag existed only to separate "this reached dev" from "this is promoted to prod," and with one environment that distinction doesn't exist.

## Maintenance mode (removed)

**There is no maintenance mode.** Nothing in Terraform or CI can put the site behind a "down for maintenance" page. If a planned-downtime page is wanted, that's a deliberate design decision, not a restore.

## WAF

There is no WAF. The previous AWS WAFv2 Web ACL ran in count-only mode in front of
Amplify Hosting and never blocked anything; it cost about $7/month for a single-user
app and was removed with Amplify. Vercel's built-in platform firewall is the only edge
protection. Adding Vercel's configurable WAF rules is a deliberate follow-on decision.

## OIDC roles

GitHub→AWS authentication uses the OIDC **provider** the org repo creates in the prod account. Both roles below are org-owned; this repo creates no GitHub-OIDC-trusted role of its own — Vercel's GitHub App is what deploys the app, not a GitHub Actions job assuming an AWS role.

- **`gha-plan`** (prod, read-only): assumed by the PR `terraform plan` job (`vars.TF_PLAN_ROLE_ARN`). `ReadOnlyAccess` — no write/apply, so a tampered PR can't mutate state or resources; the plan runs `-lock=false` because the role can't write the S3-native lock.
- **`gha-deploy`** (prod, admin): assumed by `deploy.yml`'s `apply` job (`vars.TF_APPLY_ROLE_ARN`). Broad by necessity — Terraform manages the whole account's app infra. Its trust requires the `environment:prod` OIDC subject claim, so only the reviewer-gated `prod` environment can assume it.

Trust policies pin the **numeric** GitHub org/repo IDs (immutable subject claims), so a renamed or recreated repo doesn't inherit access.

## Hardening

There is currently no `local.env_config` map in `infra/locals.tf` — the one
value it held (`s3_logs_expiration_days`, for the S3 access-log bucket) was
removed along with that bucket as unnecessary for this app (no compliance
requirement drives an access-log audit trail here, and the underlying Trivy
check for missing S3 logging, `AVD-AWS-0089`, is only LOW severity — nothing
in `security.yml`'s CI gate depended on it).

The convention still stands in `.claude/rules/infra.md` for the next
internal, code-owned value that legitimately differs prod-only-for-now but
needs no operator input: add an `env_config` map back to `infra/locals.tf`,
keyed on `var.environment`, rather than a new `variable`.

## Deploy safety — and what it doesn't cover

**A new build reaches 100% of traffic once it goes live.** There is no canary traffic shifting and **no automatic rollback**. This is a deliberate, accepted reduction in deployment safety for a single-app, single-environment pipeline. The consequence is real — a build that compiles fine but errors at request time serves every user until a human notices and rolls back.

**There is no alerting of any kind** — no alarm, no SNS topic, no app-level error-reporting service. Nothing pages a human when the app errors. Adding observability back is an open gap, not a solved problem.

## Rollback

**Nothing rolls back automatically.** Recovering from a bad release means promoting a previous production deployment, by hand, with Vercel's Instant Rollback.

**Why each stage can't be auto-reverted:**

- **Terraform (`apply`).** A `terraform apply` is never reverted if a later step fails — the applied infra stays applied. This is ordinary Terraform behavior: an automatic revert-apply can itself fail, or destroy something with live data. Recovery is a forward fix (a new PR/commit correcting the config), not an automatic revert.
- **The Vercel deploy.** Once a production build goes live, it owns 100% of traffic. Nothing watches it afterwards, so nothing moves it back automatically. Vercel keeps every previous deployment, which is why recovery is cheap — but it is a human action.
- **Database migrations.** `prisma migrate deploy` (run in the Vercel build) applies pending migrations and has no automatic "down." If it succeeds and the app is later rolled back to a previous deployment, the schema stays on the new version while the _old_ code is what's actually running. This is why every migration in this repo must be **expand/contract**: additive and backward-compatible (new nullable columns, new tables, dual-write) for at least one full release, with any drop/rename of the old shape deferred to a follow-up migration once nothing references it. A migration that isn't safe for the previous release's code to run against — not the absence of a schema-rollback step — is what actually causes an incident here.

**Recovering from a bad release** — roll back to the last-known-good deployment:

1. In the Vercel dashboard, open the project's **Deployments** and find the last-known-good production deployment.
2. Use **Instant Rollback** (or **Promote to Production**) on it. No rebuild happens, and no migration runs, so the current schema stays in place.
3. If the bad release also applied Terraform, ship a forward fix in a PR — see the Terraform bullet above.
4. If a migration needs correcting, ship a new forward migration (never edit or delete one already applied) and let the next push carry it through the Vercel build the normal way.

There is deliberately no "roll back the database" step; see the expand/contract note above.

## Setup

Bring-up — prerequisites, the GitHub variable/secret tables, state-bucket creation, first apply — is documented step by step in [`runbook.md`](runbook.md).
