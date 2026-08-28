# Deployment Environment

This repo manages a single GitHub Actions environment, `prod` — its trigger, the pipeline flow, and its hardening. For the step-by-step bring-up (prerequisites, GitHub variable/secret tables, first apply), see [`runbook.md`](runbook.md).

## Overview

Two independent things happen on a push to `main`, and neither waits on the other:

| Trigger                                        | What runs                                                         | Approval                                       |
| ---------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| Push to `main` touching `infra/**`             | `deploy.yml`'s `apply` job — `terraform apply` against prod       | Required reviewer (see "Prod approvals" below) |
| Push to the configured branch touching the app | **Amplify's own build webhook** — outside GitHub Actions entirely | None — Amplify deploys on push directly        |

**Prod is a dedicated AWS account** (a member account under a shared AWS Organization, managed by the [org repo](https://github.com/ahmax99/ahmax99-aws-org)) — the account boundary, not just the resource-name prefix, is the isolation mechanism. Account-level plumbing — the GitHub OIDC provider, the `gha-plan`/`gha-deploy` roles, and the cross-account DNS role for the apex zone — is owned by the org repo, not this one; this repo's Terraform manages only the app infrastructure inside the prod account.

PRs touching `infra/**` get an automatic `terraform plan` comment via `terraform-plan.yml`. That job deliberately carries **no** `environment:` — a read-only, PR-time plan must not be gated behind prod's required-reviewer rule — so its `TF_VAR_*` inputs are repo-level secrets/variables rather than environment-scoped ones (see the runbook's GitHub configuration reference).

**Prod approvals.** `deploy.yml`'s `apply` job runs under `environment: prod`, so a push to `main` touching `infra/**` prompts the required reviewer before Terraform applies. **App deploys carry no such gate** — Amplify's build webhook fires directly off the push, independent of GitHub's environment protection rules. This is a deliberate trade for simplicity: there is no reviewer step, no CI job, and no AWS role assumption between a push and the app going live.

## Ordering invariants

| Invariant                                                       | Mechanism                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One `terraform apply` at a time per state file                  | Job-level `concurrency: terraform-state-prod` on `deploy.yml`'s `apply` job (also used by `destroy.yml`, so a teardown can never race a regular apply)        |
| A Terraform apply is never interrupted                          | `cancel-in-progress: false` — cancelling the run wouldn't stop the AWS-side apply, it would just orphan it and block the next one                             |
| The database schema always lands before the app that expects it | Amplify's own `preBuild` phase runs `prisma migrate deploy` before `build` runs `next build` — enforced by `amplify.yml`'s phase order, not by GitHub Actions |
| Infra changes and app deploys never block each other            | They are two independent triggers (Terraform via GitHub Actions, the app via Amplify's webhook) with no `needs:` edge between them                            |

## DNS

The apex zone (`<root_domain>`) can live in a different AWS account. Prod's records (`<project>.<root_domain>`, plus Amplify's certificate-verification record) are written into that zone through the org-provided cross-account role, which Terraform assumes via the `aws.dns` provider alias (`vars.DNS_ACCOUNT_ROLE_ARN` → `TF_VAR_dns_account_role_arn`).

## Pipeline flow

```
push to main, infra/** changed
  └── deploy.yml: detect → apply                                          [prod reviewer gate]

push to the configured branch, app changed
  └── Amplify build webhook (outside GitHub Actions):
        bun install → resolve DATABASE_URL from Secrets Manager
          → prisma migrate deploy → next build → deploy
```

`detect` is a single inline step in `deploy.yml` — it diffs the push range for `infra/**` and the pipeline's own definition (`.github/workflows/deploy.yml`, `.github/actions/**`, `.github/scripts/**`), and a `workflow_dispatch` always applies. On a first push or force-push, where no usable base commit exists, it fails safe by applying.

## Release automation

There is **no release-automation workflow** in this repo (no release-please, no changelog generation, no version tags) — every commit that lands on `main` is its own unit of deployment. This is a deliberate simplification for a single-environment pipeline: a release tag existed only to separate "this reached dev" from "this is promoted to prod," and with one environment that distinction doesn't exist.

## Maintenance mode (removed)

**There is no maintenance mode.** Nothing in Terraform or CI can put the site behind a "down for maintenance" page. If a planned-downtime page is wanted, that's a deliberate design decision, not a restore.

## WAF

A WAFv2 Web ACL (`infra/modules/waf`) is associated directly with the Amplify app's ARN — `aws_wafv2_web_acl_association`'s `resource_arn` accepts an Amplify app ARN directly, so no separate CloudFront distribution is needed. The Web ACL must be `CLOUDFRONT` scope, not `REGIONAL` — a regional Web ACL is rejected by Amplify with `WAFInvalidParameterException: The resource is not supported in current region`, confirmed the hard way against real infra. `CLOUDFRONT` scope is managed exclusively via the `us-east-1` AWS endpoint no matter which region the Amplify app itself runs in, so `infra/providers.tf` has a dedicated `aws.waf` provider alias pinned to `us-east-1` just for this module. It currently runs the AWS Managed Rules Core Rule Set and Known Bad Inputs rule groups in count-only mode (`override_action { count {} }`) — matches are logged to CloudWatch but nothing is blocked yet. Switching to enforce (blocking matches), adding rate-limiting/bot-control/geo rules, or adding a `aws_wafv2_web_acl_logging_configuration` for full request logging are deliberate follow-on decisions with a cost attached — see [`architecture.md`](architecture.md).

## OIDC roles

GitHub→AWS authentication uses the OIDC **provider** the org repo creates in the prod account. Both roles below are org-owned; this repo creates no GitHub-OIDC-trusted role of its own — Amplify's build webhook is what deploys the app, not a GitHub Actions job assuming an AWS role.

- **`gha-plan`** (prod, read-only): assumed by the PR `terraform plan` job (`vars.TF_PLAN_ROLE_ARN`). `ReadOnlyAccess` plus a scoped `secretsmanager:GetSecretValue` on the project secrets (plan refreshes the secret-version resources, which `ReadOnlyAccess` alone can't read) — no write/apply, so a tampered PR can't mutate state or resources; the plan runs `-lock=false` because the role can't write the S3-native lock.
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
keyed on `var.environment`, rather than a new `variable`. Amplify's own
compute has no Lambda-style reserved/provisioned concurrency knobs for this
Terraform to set — that entire class of hardening value went away with the
Lambda-based runtime it used to apply to.

## Deploy safety — and what it doesn't cover

**A new build reaches 100% of traffic once it goes live.** There is no canary traffic shifting and **no automatic rollback**. This is a deliberate, accepted reduction in deployment safety for a single-app, single-environment pipeline. The consequence is real — a build that compiles fine but errors at request time serves every user until a human notices and redeploys a previous build.

**There is no alerting of any kind** — no alarm, no SNS topic, no app-level error-reporting service. Nothing pages a human when the app errors. Adding observability back is an open gap, not a solved problem.

## Rollback

**Nothing rolls back automatically.** Recovering from a bad release means redeploying a previous build, by hand, through the Amplify console or CLI.

**Why each stage can't be auto-reverted:**

- **Terraform (`apply`).** A `terraform apply` is never reverted if a later step fails — the applied infra stays applied. This is ordinary Terraform behavior: an automatic revert-apply can itself fail, or destroy something with live data. Recovery is a forward fix (a new PR/commit correcting the config), not an automatic revert.
- **The Amplify deploy.** Once a build goes live, it owns 100% of traffic. Nothing watches it afterwards, so nothing moves it back automatically. Amplify keeps a history of previous builds, which is why recovery is cheap — but it is a human action.
- **Database migrations.** `prisma migrate deploy` (run in Amplify's `preBuild`) applies pending migrations and has no automatic "down." If it succeeds and the app is later rolled back to a previous build, the schema stays on the new version while the _old_ code is what's actually running. This is why every migration in this repo must be **expand/contract**: additive and backward-compatible (new nullable columns, new tables, dual-write) for at least one full release, with any drop/rename of the old shape deferred to a follow-up migration once nothing references it. A migration that isn't safe for the previous release's code to run against — not the absence of a schema-rollback step — is what actually causes an incident here.

**Recovering from a bad release** — redeploy the last-known-good build:

1. Open the Amplify app in the AWS console and find the last-known-good deployment in its build history.
2. Redeploy it (the Amplify console supports redeploying a previous successful build for a `WEB_COMPUTE` app without rebuilding from source). `prisma migrate deploy` having already run against that build's schema means no migration step is needed to go back.
3. If the bad release also applied Terraform, ship a forward fix in a PR — see the Terraform bullet above.
4. If a migration needs correcting, ship a new forward migration (never edit or delete one already applied) and let the next push carry it through Amplify's `preBuild` the normal way.

There is deliberately no "roll back the database" step; see the expand/contract note above.

## Setup

Bring-up — prerequisites, the GitHub variable/secret tables, state-bucket creation, first apply — is documented step by step in [`runbook.md`](runbook.md).
