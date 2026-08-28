# Deployment Runbook

Step-by-step bring-up of the `prod` environment, from an empty AWS member
account to the app live on its domain. The reference documentation for
what the environment _is_ (trigger, pipeline flow, hardening) lives in
[`deployment-environments.md`](deployment-environments.md) — this file is the
_how_, in execution order.

## Architecture recap

This repo's Terraform manages one AWS member account under the org (managed
by the separate [`ahmax99-aws-org`](https://github.com/ahmax99/ahmax99-aws-org)
repo — "the org repo"). The app itself runs on **AWS Amplify Hosting**
(`platform = WEB_COMPUTE`), which owns its own CDN, build pipeline, and SSR
compute — there is no container registry, no separate compute service, and
no CDN of this repo's own to provision. The app's domain
(`<project>.<root_domain>`) is verified against a Route 53 zone that can live
in a different account, written cross-account through an org-provided role.

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
  stack). This repo creates no role of its own against it — Amplify's build
  webhook deploys the app, not a GitHub Actions job.
- A cross-account role for apex-zone DNS writes, if the root Route 53 zone
  lives outside the prod account.
- Apex zone NS records set at the registrar.

### 2. External SaaS accounts

Collect before starting; entered as GitHub repo-level secrets in the steps
below:

- **Neon**: a Postgres connection string.
- **GitHub**: a fine-grained personal access token — Amplify uses it once to
  create its own build webhook against `aws_amplify_app`. AWS never returns
  this value on read, so re-supplying the same token on later applies is safe
  and expected. To issue one:
  1. github.com → **Settings → Developer settings → Personal access tokens →
     Fine-grained tokens → Generate new token**.
  2. **Repository access** → Only select repositories → this repo.
  3. **Permissions → Repository permissions** → set **Contents**: Read-only,
     **Webhooks**: Read and write (**Metadata**: Read-only is included
     automatically).
  4. Generate, copy the token, and set it as `TF_VAR_github_access_token`
     (see the secrets table below).

### 3. Local tooling (for the one manual step)

Terraform ≥ 1.14 and CLI credentials for the prod member account — used only
to create the state bucket. Everything after that runs through GitHub
Actions or Amplify's own build webhook.

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
environment, every value below is **repo-level** — including the values that
used to be per-environment secrets — with one deliberate exception:
`terraform-plan.yml`'s PR-time plan job carries no GitHub `environment:` (so
it isn't gated by prod's required-reviewer rule), which is _why_ these are
repo-level rather than scoped to the `prod` environment. The `prod`
environment (**Settings → Environments → `prod`**) still needs to exist —
it's what carries the **required reviewer** protection rule that gates
`deploy.yml`'s `apply` job and `destroy.yml`.

`TF_VAR_project_name` and `TF_VAR_github_org` are **not** manually configured
— every workflow derives them from the Actions context
(`github.event.repository.name` / `github.repository_owner`) in its own
`env:` block, so they can't drift from the repo they're running in.

### Repo-level variables

| Name                   | Value                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `AWS_REGION`           | e.g. `ap-northeast-1`                                                                     |
| `TF_PLAN_ROLE_ARN`     | org output `plan_role_arn` (read-only)                                                    |
| `TF_APPLY_ROLE_ARN`    | org output `prod_deploy_role_arn`                                                         |
| `DNS_ACCOUNT_ROLE_ARN` | the org-provided cross-account DNS role ARN (empty string if the zone is in this account) |
| `TF_VAR_root_domain`   | e.g. `ahmax99.online`                                                                     |

### Repo-level secrets

| Name                         | Value                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `TF_VAR_database_url`        | Neon connection string                                                                                                                    |
| `TF_VAR_github_access_token` | GitHub fine-grained PAT scoped to this repo only (Contents: Read-only, Metadata: Read-only, Webhooks: Read and write) — Amplify's webhook |

> **Two roles, two privilege tiers** (all variables — an IAM role ARN isn't a
> secret). Each pipeline step assumes the least-privileged role that still
> lets it do its job:
>
> - **`TF_PLAN_ROLE_ARN`** (read-only `gha-plan`) — PR `terraform plan`.
>   `ReadOnlyAccess` plus a scoped `secretsmanager:GetSecretValue` on the
>   project secrets (plan must read them to refresh the secret-version
>   resources — `ReadOnlyAccess` alone omits that action). No write/apply, so
>   a tampered PR can't mutate state or resources; plans run `-lock=false`
>   since the role can't write the S3 lock.
> - **`TF_APPLY_ROLE_ARN`** (admin `gha-deploy`) — `terraform apply`. Broad
>   by necessity: Terraform manages the whole account's app infra.
>
> There is no third, app-deploy tier — Amplify's own build webhook deploys
> the app, so GitHub Actions never assumes a role to do it.

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
and approve the reviewer gate. This applies the full root module: the
Amplify app, branch, and domain association; the SSR compute and build
service IAM roles; the S3 buckets; the database secret; and the DNS records
Amplify's domain verification needs. Creating `aws_amplify_app` with a valid
`access_token` also creates Amplify's own GitHub build webhook — from this
point on, a push to the configured branch triggers a build without any
further Terraform involvement.

**P4 — Verify**: push to the configured branch (or trigger a build manually
from the Amplify console) — Amplify builds and deploys the app directly. App
is live at `https://<project>.<root_domain>` once DNS has propagated and
Amplify's domain verification has completed.

## Steady state (after bring-up)

```
push to main, infra/** changed        → [prod reviewer: terraform apply]
push to the configured branch, app changed → Amplify build webhook → live
```

No manual variable wrangling — every value used after bring-up is either a
stable org/Terraform output already captured, or a secret set once during
setup. Steady-state Terraform changes flow through PRs: a PR touching
`infra/**` gets a plan comment (not reviewer-gated — see
`deployment-environments.md`); merging to `main` applies prod behind the
reviewer gate. App deploys need no PR-time gate at all — they go straight
through Amplify's webhook on push.

## Rolling back a bad release

**Read this before you need it: nothing rolls back on its own.** A deploy
takes 100% of traffic the moment Amplify's build goes live. There is no
canary, no alarm-gated auto-revert, and no alarm or notification that will
tell you something is wrong. You find out from users or from the app's logs
in the Amplify console. There is also **no maintenance page** to hide behind
while you fix it.

Recovery is redeploying the previous build:

1. **Find the last-known-good deployment.** Open the Amplify app in the AWS
   console and look at the branch's deployment history.
2. **Redeploy it.** Amplify supports redeploying a previous successful
   deployment without rebuilding from source. This does not re-run
   `prisma migrate deploy` — that already ran against that build.
3. **Confirm.** The Amplify console shows which deployment is currently live
   for the branch.

If the bad release also applied Terraform, the infra stays applied — ship a
forward fix in a PR. If a migration is the problem, ship a new forward
migration; never edit or delete one that has already been applied.

## Teardown

`destroy.yml` (**Actions → Destroy Infrastructure → Run workflow**) destroys
prod completely — including the data a plain `terraform destroy` cannot
touch: S3 object versions and the Secrets Manager name reservation.
Afterwards a fresh `terraform apply` succeeds with no manual cleanup.
Deleting the Amplify app itself is a normal, fast API call — there is no
CloudFront distribution or Lambda@Edge replica to wait on, so this teardown
has no long asynchronous wait built in.

**The database is reset, not deleted.** The Neon branch and its compute
endpoint survive — every table in `public`, including `_prisma_migrations`,
is dropped, so `TF_VAR_database_url` stays valid but the schema itself is
gone. This relies on Amplify's `preBuild` phase running
`prisma migrate deploy` on the next build to rebuild the schema from
`prisma/migrations` — there is no manual migration step to remember, same as
before, just rebuilt from source instead of preserved. Nothing here touches
the `preview/pr-*` branches `neon-workflow.yml` manages.

### Read this first

**A teardown prompts the required reviewer twice** — once each for `destroy`
and `db-reset`. Same behaviour `deploy.yml` already has with `apply`; not a
bug.

### Preconditions

- The `TF_VAR_database_url` secret is already set for Terraform — the
  `db-reset` job reuses it to connect via `psql`. Teardown does not use the
  Neon API, so no separate Neon credential is involved.

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
`infra/bootstrap/`, and the state bucket. The state object is left present
and holding an empty state, which is exactly what makes the next
`terraform apply` clean.
