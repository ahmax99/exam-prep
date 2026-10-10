# Deployment Runbook

Step-by-step bring-up of the `prod` environment, from an empty AWS member
account to the app live on its domain. The reference documentation for
what the environment _is_ (trigger, pipeline flow, hardening) lives in
[`deployment-environments.md`](deployment-environments.md) — this file is the
_how_, in execution order.

## Architecture recap

The app runs on **Vercel** (Hobby plan), which owns its own CDN, build
pipeline, and serverless compute — there is no container registry, no
separate compute service, and no CDN of this repo's own to provision. This
repo's Terraform manages the AWS side in one member account under the org
(managed by the separate
[`ahmax99-aws-org`](https://github.com/ahmax99/ahmax99-aws-org) repo — "the
org repo"): the S3 bucket for question images and the Route 53 records for the
app's domain (`<project>.<root_domain>`), written into a zone that can live in
a different account through an org-provided role.

> **Status:** the Vercel project (env vars, custom domain) and the IAM role its
> functions assume to read S3 are not in Terraform yet — they land with the
> Vercel module. Until then, create and configure the Vercel project by hand
> (step P4 below).

## Prerequisites

### 1. Org repo applied

The org repo's `accounts` stack must be applied and providing (check its
`terraform output`):

- The prod member account, with this repo registered in `app_repositories`.
- `prod_deploy_role_arn` — the prod account's admin `gha-deploy` OIDC role,
  used by **Terraform apply** only.
- `plan_role_arn` — a read-only `gha-plan` role, used by PR
  **Terraform plan** (`ReadOnlyAccess`; can't apply or write state).
- The GitHub **OIDC provider** in the prod account (created by the accounts
  stack). This repo creates no role of its own against it — Vercel's GitHub
  App deploys the app, not a GitHub Actions job.
- A cross-account role for apex-zone DNS writes, if the root Route 53 zone
  lives outside the prod account.
- Apex zone NS records set at the registrar.

### 2. External SaaS accounts

- **Neon**: a Postgres connection string.
- **Vercel**: an account (Hobby plan) with the **Vercel GitHub App** installed
  on this repo, so a push to `main` can trigger a production deployment.

### 3. Local tooling (for the one manual step)

Terraform ≥ 1.14 and CLI credentials for the prod member account — used only
to create the state bucket. Everything after that runs through GitHub
Actions or Vercel's GitHub App.

Authenticate via the org's IAM Identity Center (SSO), not long-lived keys. The
org repo's [CLI access (Identity Center SSO)](https://github.com/ahmax99/ahmax99-aws-org#cli-access-identity-center-sso)
section has the one-time `~/.aws/config` block and the authoritative account
IDs. Once configured:

```bash
export AWS_PROFILE=ahmax99-prod
aws sso login                           # logs in via that profile's SSO session
aws sts get-caller-identity             # confirm the right account
```

Set `AWS_PROFILE` (Terraform and the CLI both read it) before every command
below; a wrong-profile apply lands in the wrong account with no name-prefix
safety net. The SSO session is time-limited — re-run `aws sso login` when it
expires.

## GitHub configuration reference

Set under **Settings → Secrets and variables → Actions**. With a single
environment, every value below is **repo-level**, because
`terraform-plan.yml`'s PR-time plan job carries no GitHub `environment:` (so
it isn't gated by prod's required-reviewer rule). The `prod` environment
(**Settings → Environments → `prod`**) still needs to exist — it's what
carries the **required reviewer** protection rule that gates `deploy.yml`'s
`apply` job and `destroy.yml`.

`TF_VAR_project_name` is **not** manually configured — every workflow derives
it from the Actions context (`github.event.repository.name`) in its own `env:`
block, so it can't drift from the repo it's running in.

### Repo-level variables

| Name                   | Value                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `AWS_REGION`           | e.g. `ap-northeast-1`                                                                     |
| `TF_PLAN_ROLE_ARN`     | org output `plan_role_arn` (read-only)                                                    |
| `TF_APPLY_ROLE_ARN`    | org output `prod_deploy_role_arn`                                                         |
| `DNS_ACCOUNT_ROLE_ARN` | the org-provided cross-account DNS role ARN (empty string if the zone is in this account) |
| `TF_VAR_root_domain`   | e.g. `ahmax99.online`                                                                     |

### Repo-level secrets

| Name                  | Value                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `TF_VAR_database_url` | Neon connection string. Despite the legacy name, only `destroy.yml`'s `db-reset` job reads it now. |

> **Two roles, two privilege tiers** (all variables — an IAM role ARN isn't a
> secret). Each pipeline step assumes the least-privileged role that still
> lets it do its job:
>
> - **`TF_PLAN_ROLE_ARN`** (read-only `gha-plan`) — PR `terraform plan`.
>   `ReadOnlyAccess`; no write/apply, so a tampered PR can't mutate state or
>   resources; plans run `-lock=false` since the role can't write the S3 lock.
> - **`TF_APPLY_ROLE_ARN`** (admin `gha-deploy`) — `terraform apply`. Broad
>   by necessity: Terraform manages the whole account's app infra.
>
> There is no third, app-deploy tier — Vercel's GitHub App deploys the app,
> so GitHub Actions never assumes a role to do it.

> **`DNS_ACCOUNT_ROLE_ARN`** is set whenever prod writes into an apex zone
> hosted in a different account — Terraform assumes it via the `aws.dns`
> provider alias. Set it to an explicit empty string if the zone lives in
> this same account.

## Prod environment setup

**P1 — Create the state bucket** (local, prod-account credentials via the
`ahmax99-prod` SSO profile — the only manual Terraform of the bring-up):

```bash
export AWS_PROFILE=ahmax99-prod
aws sso login   # if the session has expired
cd infra/bootstrap
terraform init
terraform apply -var="project_name=exam-prep" -var="environment=prod" -auto-approve
```

**P2 — Configure GitHub**: create the `prod` environment and add at least one
**Required reviewer** under deployment protection rules (without it, Terraform
applies run unattended). Set the repo-level variables and secrets per the
tables above.

**P3 — First apply**: run `Deploy` (`deploy.yml`) via **workflow_dispatch**
and approve the reviewer gate. This applies the root module: the S3 images
bucket and the (currently empty) DNS record set.

**P4 — Vercel project** (manual until the Vercel module lands): import this
repo in Vercel with **Root Directory** `apps/nextjs` (the build command comes
from `apps/nextjs/vercel.json`). Set the production environment variables
`DATABASE_URL` (sensitive), `S3_BUCKET_NAME`, and `AWS_REGION`. Add the custom
domain `<project>.<root_domain>` and create the CNAME Vercel asks for in the
Route 53 zone.

**P5 — Verify**: push to `main` (or redeploy from the Vercel dashboard) —
Vercel builds, runs `prisma migrate deploy`, and deploys. The app is live at
`https://<project>.<root_domain>` once DNS has propagated and Vercel has
issued the certificate.

## Steady state (after bring-up)

```
push to main, infra/** changed  → [prod reviewer: terraform apply]
push to main, app changed       → Vercel GitHub App → live
```

Steady-state Terraform changes flow through PRs: a PR touching `infra/**`
gets a plan comment (not reviewer-gated — see `deployment-environments.md`);
merging to `main` applies prod behind the reviewer gate. App deploys need no
PR-time gate at all — they go straight through Vercel on push.

## Rolling back a bad release

**Read this before you need it: nothing rolls back on its own.** A deploy
takes 100% of traffic the moment Vercel promotes the production build. There
is no canary, no alarm-gated auto-revert, and no alarm or notification that
will tell you something is wrong. You find out from users or from the
function logs in the Vercel dashboard. There is also **no maintenance page**
to hide behind while you fix it.

Recovery is rolling back to the previous deployment:

1. **Find the last-known-good deployment.** In the Vercel dashboard, open the
   project's **Deployments** list.
2. **Roll back.** Use **Instant Rollback** (or **Promote to Production**) on
   that deployment. Nothing is rebuilt, and `prisma migrate deploy` does not
   re-run.
3. **Confirm.** The project overview shows which deployment is currently
   serving production.

If the bad release also applied Terraform, the infra stays applied — ship a
forward fix in a PR. If a migration is the problem, ship a new forward
migration; never edit or delete one that has already been applied.

## Teardown

`destroy.yml` (**Actions → Destroy Infrastructure → Run workflow**) destroys
the Terraform-managed prod infra completely — including S3 object versions,
which a plain `terraform destroy` cannot touch. Afterwards a fresh
`terraform apply` succeeds with no manual cleanup. The Vercel project is not
managed by Terraform yet, so remove it (or pause it) from the Vercel
dashboard if you want the app fully offline.

**The database is reset, not deleted.** The Neon branch and its compute
endpoint survive — the `public` schema is emptied, including
`_prisma_migrations`, so the connection string stays valid but the schema
itself is gone. The next Vercel build's `prisma migrate deploy` rebuilds it
from `prisma/migrations` — there is no manual migration step to remember.
Nothing here touches the `preview/pr-*` branches `neon-workflow.yml` manages.

### Read this first

**A teardown prompts the required reviewer twice** — once each for `destroy`
and `db-reset`. Same behaviour `deploy.yml` already has with `apply`; not a
bug.

**Back up the database first** if its data matters: create a Neon branch from
production (for example `pre-destroy-<date>`) before dispatching. The reset
empties the schema, and Neon's point-in-time restore window may be too short
to recover it later.

### Preconditions

- The `TF_VAR_database_url` secret is set — the `db-reset` job uses it to
  connect via `psql`. Teardown does not use the Neon API, so no separate Neon
  credential is involved.

### Procedure

1. Dispatch **Destroy Infrastructure** and type the confirmation exactly:
   `destroy prod`. `preflight` rejects a mismatch in seconds — before any
   credentials are issued and before the reviewer is asked to approve.
2. Approve the `prod` environment gate when prompted (once for `destroy`,
   once for `db-reset`).
3. The run is green only if the final **Assert the state is empty** step
   passes; it fails the job if anything survives in state.

### What survives

The Route 53 **hosted zone** (org-owned — only the records go),
`infra/bootstrap/`, the state bucket, and the Vercel project. The state
object is left present and holding an empty state, which is exactly what
makes the next `terraform apply` clean.
