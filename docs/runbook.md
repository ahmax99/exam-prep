# Deployment Runbook

Step-by-step bring-up of the `dev` and `prod` environments, from an empty AWS
member account to the app live on its domain. The reference documentation for
what the environments _are_ (triggers, pipeline flow, hardening) lives in
[`deployment-environments.md`](deployment-environments.md) — this file is the
_how_, in execution order.

## Architecture recap

Three AWS member accounts under the org (managed by the separate
[`ahmax99-aws-org`](https://github.com/ahmax99/ahmax99-aws-org) repo — "the org
repo"):

| Account           | Owns                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared-services` | Route 53 apex zone (`<root_domain>`), **central ECR** (`<project>-backend` / `<project>-frontend`), `gha-ecr-push` role, `dns-apex-manager` role |
| `dev`             | `dev.<root_domain>` zone (delegated by the org repo), all dev app infra, `gha-deploy` role                                                       |
| `prod`            | All prod app infra, `gha-deploy` role (assumable only from the `prod` GitHub environment)                                                        |

Images are **built once** into the central ECR (org-wide pull via
`aws:PrincipalOrgID`) and deployed by digest-identical URI to both
environments — there is no per-environment registry and no image promotion
step. App domains: `<project>.dev.<root_domain>` (dev),
`<project>.<root_domain>` (prod).

## Prerequisites

### 1. Org repo applied

The org repo's `accounts` stack must be applied and providing (check its
`terraform output`):

- The three member accounts, with this repo registered in `app_repositories`
  and its ECR repos in `ecr_repositories`.
- `dev_deploy_role_arn` / `prod_deploy_role_arn` — the per-account admin
  `gha-deploy` OIDC roles, used by **Terraform apply** only.
- `plan_role_arn` — the dev read-only `gha-plan` role, used by PR
  **Terraform plan** (ReadOnlyAccess; can't apply or write state).
- The GitHub **OIDC provider** in each member account (created by the accounts
  stack). This repo's Terraform creates its own scoped `gha-app-deploy` role
  against it — see `APP_DEPLOY_ROLE_ARN` below — so no app-deploy role ARN comes
  from the org repo.
- `ecr_push_role_arn` — the shared-services `gha-ecr-push` role.
- `dns_apex_manager_role_arn` — the shared-services role prod assumes for
  apex-zone DNS writes.
- `ecr_repository_urls` — the central repos.
- `shared_services_account_id` — the account hosting the central ECR; becomes
  `CENTRAL_ECR_ACCOUNT_ID` below.
- Apex zone NS records set at the registrar (`apex_zone_name_servers` output),
  and the `dev.<root_domain>` zone + NS delegation created in the dev account.

### 2. Org repo requirements this pipeline depends on

Two properties of the central ECR repos this repo's pipeline assumes — verify
they hold in the org repo before first use:

- **Re-pushable `latest` tag.** The pipeline pushes `:latest` on every build
  and Terraform's Lambda definitions reference it, so the repos need
  `image_tag_mutability = "IMMUTABLE_WITH_EXCLUSION"` with a `latest*`
  wildcard exclusion filter — a strict `IMMUTABLE` registry rejects the second
  `:latest` push.
- **Lambda service-principal pull.** Cross-account Lambda container images
  require the repo policy to grant `ecr:BatchGetImage` +
  `ecr:GetDownloadUrlForLayer` to the **`lambda.amazonaws.com` service
  principal** (scoped org-wide with an `aws:SourceOrgID` condition), in
  addition to the org-wide account-principal pull statement. Without it,
  function creation/updates in dev/prod fail to pull the image. Provided by the
  org repo's `modules/ecr` (`LambdaServicePull` statement).
- **Cross-account read for the apply role.** Before the steady-state/bootstrap
  decision, `deploy.yml`'s `apply-dev`/`apply-prod` jobs' "Check ECR image
  state" step calls `ecr:BatchGetImage` against the central registry **under
  the `gha-deploy`
  apply role** (it runs before any role re-assumption). The org-wide pull
  statement on the repo policy covers the resource side; the apply role's own
  identity policy must also allow `ecr:BatchGetImage` on those repos (the admin
  `gha-deploy` role does). If that read is ever denied the check now **fails
  loudly** rather than silently treating the images as absent and forcing an
  unnecessary bootstrap — see `.github/scripts/terraform-ecr-check.sh`.
- **A `gha-ecr-purge` role for teardown.** `destroy.yml`'s `ecr-purge` job is the
  only consumer. It is least-privilege and separate from `gha-ecr-push` by
  design: it lives in shared-services, grants image **delete** on the central
  repos, and its `subject_claims` accept only environment-scoped OIDC subs
  (`:environment:dev` / `:environment:prod`), so no PR branch can assume it.
  Surfaced as the org output `ecr_purge_role_arn` → `ECR_PURGE_ROLE_ARN` below.

### 3. External SaaS accounts (per environment)

Collect before starting an environment; entered as GitHub environment secrets
in the steps below:

- **Neon**: a connection string per environment (separate branch or database).
- **Google OAuth**: a separate OAuth client per environment (redirect URI is
  registered after the first apply — step D6/P5).
- **Resend**: API key.
- **Sentry**: **two** DSNs per environment — one backend project, one frontend
  project.
- A fresh `session_secret` per environment: `openssl rand -base64 32`.

### 4. Local tooling (for the one manual step per environment)

Terraform ≥ 1.14 and CLI credentials for the target member account — used only
to create that environment's state bucket. Everything after that runs through
GitHub Actions.

Authenticate via the org's IAM Identity Center (SSO), not long-lived keys. The
org repo's [CLI access (Identity Center SSO)](https://github.com/ahmax99/ahmax99-aws-org#cli-access-identity-center-sso)
section has the one-time `~/.aws/config` block (the `ahmax99` `sso-session`
plus the per-account profiles — `ahmax99-dev`, `ahmax99-prod`, `ahmax99-shared`,
`ahmax99-mgmt`) and the authoritative account IDs. Once configured:

```bash
export AWS_PROFILE=ahmax99-dev          # the account you're operating on
aws sso login                           # logs in via that profile's SSO session
aws sts get-caller-identity             # confirm the right account
```

Set `AWS_PROFILE` (Terraform and the CLI both read it) before every command
below; a wrong-profile apply lands in the wrong account with no name-prefix
safety net. The `AdminAccess` session lasts 8 hours — re-run `aws sso login`
when it expires.

### 5. Automation GitHub App (repo-level, one-time)

`release-please.yml` (`.github/workflows/release-please.yml`) must authenticate
as a **GitHub App**, not the default `GITHUB_TOKEN` — see
[`deployment-environments.md`'s "Release automation"](deployment-environments.md#release-automation)
for why. `toggle-maintenance.yml` reuses the same App to write the
`MAINTENANCE_MODE` environment variable, which `GITHUB_TOKEN` also can't do.
Create it once:

1. **Register the App**: your GitHub avatar → **Settings** → **Developer
   settings** → **GitHub Apps** → **New GitHub App**.
   - **GitHub App name**: anything unique, e.g. `<project>-automation`.
   - **Homepage URL**: this repo's URL (not otherwise used).
   - **Webhook**: uncheck **Active** — this App only mints tokens for Actions,
     it doesn't need to receive events.
   - **Repository permissions**: `Contents: Read and write`,
     `Pull requests: Read and write`, `Environments: Read and write`. Leave everything else at `No access`.
   - **Where can this GitHub App be installed?**: **Only on this account**.
   - Click **Create GitHub App**.
2. **Note the Client ID** shown at the top of the App's settings page (used
   over the older numeric App ID — `actions/create-github-app-token`
   recommends `client-id`).
3. **Generate a private key**: still on the App's settings page, under
   **Private keys**, click **Generate a private key** — downloads a `.pem`
   file. Store it; GitHub only keeps the public half.
4. **Install the App on this repo**: same settings page → **Install App** →
   install on your account → **Only select repositories** → choose this repo
   → **Install**.
5. **Add repo-level GitHub config** (table below): `AUTOMATION_APP_CLIENT_ID`
   as a **variable** (not sensitive — a Client ID is just an identifier, same
   reasoning as the role ARNs elsewhere in this doc), and
   `AUTOMATION_APP_PRIVATE_KEY` as a **secret** holding the full `.pem`
   file contents.

## GitHub configuration reference

Set under **Settings → Secrets and variables → Actions** (repo level) and
**Settings → Environments → `<env>`** (environment level).

### Repo-level variables (shared by both environments)

| Name                       | Value                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| `AWS_REGION`               | e.g. `ap-northeast-1`                                              |
| `CENTRAL_ECR_ACCOUNT_ID`   | org output `shared_services_account_id`                            |
| `ECR_PUSH_ROLE_ARN`        | org repo output `ecr_push_role_arn`                                |
| `ECR_PURGE_ROLE_ARN`       | org repo output `ecr_purge_role_arn` (teardown only)               |
| `TF_PLAN_ROLE_ARN`         | org repo output `plan_role_arn` (read-only; plans only run on dev) |
| `TF_VAR_root_domain`       | e.g. `ahmax99.online`                                              |
| `TF_VAR_contact_to_email`  | contact-form recipient                                             |
| `TF_VAR_from_email`        | sender address (on the root domain)                                |
| `AUTOMATION_APP_CLIENT_ID` | Client ID from step 5 above                                        |

### Repo-level secrets

| Name                         | Value                                              |
| ---------------------------- | -------------------------------------------------- |
| `AUTOMATION_APP_PRIVATE_KEY` | Full contents of the `.pem` file from step 5 above |

### Per-environment values

| Name                          | Kind     | `dev`                              | `prod`                                 |
| ----------------------------- | -------- | ---------------------------------- | -------------------------------------- |
| `TF_APPLY_ROLE_ARN`           | variable | org output `dev_deploy_role_arn`   | org output `prod_deploy_role_arn`      |
| `APP_DEPLOY_ROLE_ARN`         | variable | Terraform output after first apply | Terraform output after first apply     |
| `DNS_ACCOUNT_ROLE_ARN`        | variable | _(leave unset)_                    | org output `dns_apex_manager_role_arn` |
| `STATIC_ASSETS_BUCKET`        | variable | Terraform output after first apply | Terraform output after first apply     |
| `CLOUDFRONT_DISTRIBUTION_ID`  | variable | Terraform output after first apply | Terraform output after first apply     |
| `TF_VAR_database_url`         | secret   | dev Neon connection string         | prod Neon connection string            |
| `TF_VAR_google_client_id`     | secret   | dev OAuth client                   | separate prod OAuth client             |
| `TF_VAR_google_client_secret` | secret   | dev OAuth client                   | prod OAuth client                      |
| `TF_VAR_resend_api_key`       | secret   | Resend key                         | prod Resend key                        |
| `TF_VAR_session_secret`       | secret   | fresh `openssl rand -base64 32`    | fresh, distinct from dev               |
| `TF_VAR_backend_sentry_dsn`   | secret   | dev backend Sentry project         | prod backend Sentry project            |
| `TF_VAR_frontend_sentry_dsn`  | secret   | dev frontend Sentry project        | prod frontend Sentry project           |

> **Three roles, three privilege tiers** (all variables — an IAM role ARN isn't
> a secret). Each pipeline step assumes the least-privileged role that still
> lets it do its job:
>
> - **`TF_PLAN_ROLE_ARN`** (repo-level, read-only `gha-plan`) — PR `terraform
plan`. `ReadOnlyAccess` plus a scoped `secretsmanager:GetSecretValue` on the
>   dev project secrets (plan must read them to refresh the secret-version
>   resources — `ReadOnlyAccess` alone omits that action). No write/apply, so a
>   tampered PR can't mutate state or resources; plans run `-lock=false` since
>   the role can't write the S3 lock. Repo-level because plans only run on dev.
> - **`TF_APPLY_ROLE_ARN`** (per-env, admin `gha-deploy`) — `terraform apply`.
>   Broad by necessity: Terraform manages the whole account's app infra.
> - **`APP_DEPLOY_ROLE_ARN`** (per-env, scoped `gha-app-deploy`) — the
>   `deploy.yml` app deploy jobs. This role is created by **this repo's own
>   Terraform** (`modules/github-deploy-role`, consuming the org-created OIDC
>   provider), so it's a captured Terraform output, not an org output. Its
>   policy grants only the Lambda/CodeDeploy/S3/CloudFront/ECR-pull actions
>   those jobs perform, scoped to this environment's **exact** resource ARNs — a
>   compromised app-deploy step can't touch anything else in the account.
>
> The role's OIDC trust needs this repo's GitHub org/repo IDs
> (`TF_VAR_github_org` / `_org_id` / `_repo_id`); CI supplies them automatically
> from the Actions context, so there's nothing to configure by hand.

> **`DNS_ACCOUNT_ROLE_ARN`** follows the DNS ownership split: **empty ⇒ the
> zone is in this account**, so no cross-account hop is needed. Dev writes into
> its own `dev.<root_domain>` zone (delegated into the dev account by the org),
> so it stays empty and the `aws.dns` provider falls back to ambient
> credentials. Prod writes into the apex zone in shared-services, a different
> account, so it assumes the `dns-apex-manager` role. GitHub Actions rejects an
> empty variable value, so on dev you **leave the variable unset** — an absent
> `vars.DNS_ACCOUNT_ROLE_ARN` resolves to `""` in the workflow, exactly what dev
> wants.

There are **no** per-environment ECR variables: image URLs are derived in the
workflows and in Terraform from `CENTRAL_ECR_ACCOUNT_ID` + the repo name, so
they cannot drift.

## Dev environment setup

**D1 — Confirm prerequisites** (org repo applied, section above), and collect
the org repo outputs.

**D2 — Create the dev state bucket** (local, dev-account credentials via the
`ahmax99-dev` SSO profile — the only manual Terraform of the bring-up):

```bash
export AWS_PROFILE=ahmax99-dev
aws sso login   # if the session has expired
cd infra/bootstrap
terraform init
terraform workspace new dev
terraform apply -var="project_name=boilerplate-template" -var="environment=dev" -auto-approve
```

**D3 — Configure GitHub**: create the `dev` environment (no protection
rules), then set the repo-level variables and dev's per-environment values per
the tables above. Skip the three Terraform-output rows for now
(`STATIC_ASSETS_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `APP_DEPLOY_ROLE_ARN`).

**D4 — First dev apply**: run `Deploy` (`deploy.yml`) via **workflow_dispatch**
with `scope: infra-only` (leave `apply_prod` unchecked — it's ignored for this
scope anyway). `scope: infra-only` matters here specifically: `STATIC_ASSETS_BUCKET`,
`CLOUDFRONT_DISTRIBUTION_ID`, and `APP_DEPLOY_ROLE_ARN` don't exist yet, so letting
the app-build/deploy jobs run in this first dispatch would just fail them — this
scope runs only `detect` + `apply-dev`. The org `gha-deploy` role already exists, so
no elevated-credential exception is needed. The apply detects the fresh
environment (bootstrap mode): it seeds the central ECR `:latest` images via
the `gha-ecr-push` role if they're missing, applies the full root module, and
publishes the initial Lambda versions. Dev's DNS records and ACM validation
are written into the org-created `dev.<root_domain>` zone in-account — no
manual delegation step.

**D5 — Capture Terraform outputs** from D4's `apply-dev` job summary into the
`dev` environment: `vars.STATIC_ASSETS_BUCKET` (`static_assets_bucket_name`),
`vars.CLOUDFRONT_DISTRIBUTION_ID` (`cloudfront_distribution_id`),
`vars.APP_DEPLOY_ROLE_ARN` (`app_deploy_role_arn`). D4 ran under the admin
apply role, so the app-deploy role exists after it — capture it before D7.

**D6 — Register the Google OAuth redirect URI**
(`https://<cognito_domain>.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse`, from the `cognito_domain`
output) on the dev OAuth client.

**D7 — Verify**: push to `main` (or dispatch `Deploy` with `scope: apps-only`,
now that D5's app-deploy vars exist) — builds push to the central registry and
deploy to dev. App is live at `https://<project>.dev.<root_domain>`.

## Prod environment setup

Do this only after dev works — prod deploys re-use the images dev already
built.

**P1 — Create the prod state bucket** (local, **prod-account** credentials via
the `ahmax99-prod` SSO profile):

```bash
export AWS_PROFILE=ahmax99-prod
aws sso login   # if the session has expired
cd infra/bootstrap
terraform workspace new prod
terraform apply -var="project_name=boilerplate-template" -var="environment=prod" -auto-approve
```

**P2 — Configure GitHub**: create the `prod` environment and add at least one
**Required reviewer** under deployment protection rules (without it, prod
deploys run unattended). Set prod's per-environment values per the table —
including `vars.DNS_ACCOUNT_ROLE_ARN` (the `dns-apex-manager` role), which dev
doesn't set.

**P3 — First prod apply**: run `Deploy` (`deploy.yml`) via **workflow_dispatch**
with `scope: infra-only` and `apply_prod: true`, and approve the reviewer
gate. Prod's apex DNS records and ACM validation are written cross-account
through the `dns-apex-manager` role; images already exist centrally, so
bootstrap mode only applies + publishes Lambda versions.

> **New prod accounts start with a Lambda concurrency quota of 10.** Prod's
> `env_config` (`infra/locals.tf`) reserves concurrency
> (`reserved_concurrent_executions = 10`, `provisioned_concurrent_executions =
2`), but AWS caps brand-new accounts at a total **Concurrent executions**
> quota of 10 and always keeps a floor of 10 unreserved — so the apply fails
> with `InvalidParameterValueException: Specified ReservedConcurrentExecutions
for function decreases account's UnreservedConcurrentExecution below its
minimum value of [10]`. Request an increase in the **prod account**, region
> `ap-northeast-1`:
>
> ```bash
> aws service-quotas request-service-quota-increase \
>   --service-code lambda --quota-code L-B99A9384 \
>   --desired-value 1000 --region ap-northeast-1
> ```
>
> The request is asynchronous — `PENDING` → often `APPROVED` within minutes, or
> `CASE_OPENED` if AWS routes it to a support review (common for freshly-created
> accounts; can take hours to a couple of business days). Track it with
> `aws service-quotas list-requested-service-quota-change-history-by-quota
--service-code lambda --quota-code L-B99A9384 --region ap-northeast-1`, and
> confirm `aws lambda get-account-settings --region ap-northeast-1` reports
> `AccountLimit.ConcurrentExecutions = 1000` before re-running the apply. To
> unblock without waiting, temporarily set prod's `reserved_concurrent_executions
= -1` and `provisioned_concurrent_executions = 0` in `locals.tf` (matches dev;
> revert once the quota lands).

**P4 — Capture Terraform outputs** into the `prod` environment:
`vars.STATIC_ASSETS_BUCKET`, `vars.CLOUDFRONT_DISTRIBUTION_ID`,
`vars.APP_DEPLOY_ROLE_ARN` (`app_deploy_role_arn`).

**P5 — Register the prod Google OAuth redirect URI**
(`https://<cognito_domain>.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse`, from the `cognito_domain`
output) on the prod OAuth client.

**P6 — Cut the first release**: merge the release PR / push a `v*` tag.
`deploy.yml` builds once, then (behind the reviewer gate) applies prod
Terraform via `apply-prod`, then (behind the reviewer gate again) deploys
that image URI to prod — backend first, then frontend, all in the same
workflow run. Dev is untouched by the release; it already runs the tagged
commit from the branch push that carried it. App is live at
`https://<project>.<root_domain>`.

## Steady state (after bring-up)

```
push to main            → build → deploy dev
merge Release PR → v*   → build → [prod reviewer: apply-prod] → [prod reviewer: deploy backend → frontend] → prod live
```

No manual variable wrangling — every value used after bring-up is either a
stable org/Terraform output already captured, or a secret set once during
setup. Steady-state Terraform changes flow through PRs: a PR touching
`infra/**` gets a dev plan comment; merge applies dev; a `v*` tag
applies prod behind the reviewer gate.

## Teardown

`destroy.yml` (**Actions → Destroy Infrastructure → Run workflow**) destroys one
environment completely — including the data a plain `terraform destroy` cannot
touch: S3 object versions, the Cognito user pool and its users, the Secrets
Manager name reservation, and Lambda@Edge replicas. Afterwards a fresh
`terraform apply` succeeds with no manual cleanup.

**The database is reset, not deleted.** The Neon branch and its compute endpoint
survive — every table in `public`, including `_prisma_migrations`, is dropped, so
`TF_VAR_database_url` stays valid but the schema itself is gone. This relies on
`deploy.yml`'s `migrate-dev`/`migrate-prod` jobs (see
[`deployment-environments.md`](deployment-environments.md#rollback)) running
`prisma migrate deploy` on the next redeploy to rebuild the schema from
`prisma/migrations` — there is no manual migration step to remember, same as
before, just rebuilt from source instead of preserved. Nothing here touches the
`preview/pr-*` branches `neon-workflow.yml` manages.

### Read this first

> ⚠️ **The ECR purge is cross-environment.** The central repos are
> `<project>-backend` and `<project>-frontend` with **no environment segment**,
> so tearing down **dev also deletes prod's images**. Already-running prod
> Lambdas keep serving (Lambda copied the image into its own store at deploy
> time), but **prod re-deploys fail** until the next build pushes a fresh image,
> and new-instance provisioning is no longer guaranteed once Lambda's cache
> evicts. Accepted trade-off — but know it before you dispatch.

Two more consequences worth expecting:

- **`APP_DEPLOY_ROLE_ARN` dangles.** Teardown destroys `module.app_deploy_role`,
  so `deploy.yml`'s deploy jobs fail until someone re-applies Terraform and
  re-captures the output.
- **A prod teardown prompts the required reviewer up to three times** — once each
  for `destroy`, `db-reset`, and `ecr-purge`. Same behaviour `deploy.yml`
  already has with `apply-prod` plus its two prod deploy jobs; not a bug.

### Preconditions

- The org repo's `gha-ecr-purge` role is applied and `ECR_PURGE_ROLE_ARN` is set
  as a repo-level variable. Without it `ecr-purge` **fails** while the teardown
  itself succeeds, leaving images behind — deliberate, so it can't pass
  unnoticed. Re-dispatch once the variable is set, or purge by hand.
- The database step needs only the `TF_VAR_database_url` secret each environment
  already sets for Terraform. Teardown does **not** use the Neon API, so no
  `NEON_*` variable or key is involved.

### Procedure

1. Dispatch **Destroy Infrastructure**, pick the environment, and type the
   confirmation exactly:
   - dev → `destroy dev`
   - prod → `destroy prod`

   The phrase embeds the environment, so a string copied from a dev run cannot
   authorize prod. `preflight` rejects a mismatch in seconds — before any
   credentials are issued and before a prod reviewer is asked to approve.

2. Approve the `prod` environment gate when prompted (prod only).
3. Expect **30–90 minutes**. Most of it is CloudFront disabling-then-deleting and
   Lambda@Edge replicas releasing their functions.
4. The run is green only if the final **Assert the state is empty** step passes;
   it fails the job if anything survives in state.

### When the retry loop exhausts

`terraform-destroy-retry.sh` gives up after 3 attempts (10 minutes apart) and
says so with an `::error::`. The environment is **partially emptied, not
wedged** — destroy writes state as resources go, so simply **re-dispatch** and it
resumes where it stopped. A Lambda@Edge replica can hold its function for up to
90 minutes, which is longer than one run's ~20 minutes of waiting covers, so
expect a re-dispatch (occasionally two) on a teardown that has edge functions.
Two more things to know while retrying:

- The Cognito pool may sit with default configuration between attempts
  (`update-user-pool` resets unspecified attributes). Harmless — the next apply
  restores it if you abandon the teardown.
- Log delivery can refill the `logs` bucket between the purge and the bucket
  delete, producing `BucketNotEmpty`. Re-dispatching re-runs the purge first,
  which is why emptying is a workflow step rather than a one-shot manual action.

### What survives

The Route53 **hosted zone** (org-owned — only the records go), the central ECR
**repositories** (only the images inside them are purged), `infra/bootstrap/`,
and the state bucket. The state object is left present and holding an empty
state, which is exactly what makes the next `terraform apply` clean.
