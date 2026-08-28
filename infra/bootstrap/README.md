# Terraform Backend Bootstrap

This directory contains the Terraform configuration to create the **S3 state buckets** — one dedicated bucket per environment (`<project>-dev-terraform-state`, `<project>-prod-terraform-state`), each holding its state at the bucket root (`terraform.tfstate`, no key prefix needed since the bucket itself is the environment boundary).

## Purpose

Creates the following resources (once per environment):

- **S3 Bucket**: Stores that environment's Terraform state with native S3 locking

This is the **only** resource the bring-up creates outside the CI pipeline. Everything else the pipeline needs to authenticate — the GitHub OIDC providers, the per-account `gha-deploy` roles, the shared `gha-ecr-push` role — is provided by the org repo (see [`docs/runbook.md`](../../../docs/runbook.md)), so there is no OIDC/role seeding step here anymore.

## Prerequisites

1. CLI credentials via the org's IAM Identity Center (SSO) — set `AWS_PROFILE` to the target account (`ahmax99-dev` / `ahmax99-prod`) and run `aws sso login`. The one-time `~/.aws/config` block and account IDs live in the [org repo's CLI-access section](https://github.com/ahmax99/ahmax99-aws-org#cli-access-identity-center-sso).
2. Terraform >= 1.14.0 installed

## Important Notes

⚠️ **Run this ONCE per environment, before setting that environment up (dev before prod)**

⚠️ **dev and prod are separate AWS accounts.** Switch your SSO profile (`export AWS_PROFILE=ahmax99-dev` vs `ahmax99-prod`) before each environment's commands, and confirm with `aws sts get-caller-identity` — a wrong-profile apply lands in the wrong account.

⚠️ **This configuration uses LOCAL state** (not remote S3 backend) because it creates the backend resources themselves — use a separate Terraform **workspace** per environment so each environment's bucket is tracked independently and running one environment can never touch another's tracked resource

⚠️ **Keep the `terraform.tfstate.d/` directory safe** - it's stored locally in this directory (one state file per workspace)

## Setup Instructions

Run the `dev` block under the `ahmax99-dev` profile, the `prod` block under
`ahmax99-prod` — these are two separate accounts, not two workspaces in one:

```bash
export AWS_PROFILE=ahmax99-dev
aws sso login   # one login covers both accounts (shared SSO session)
cd infra/bootstrap
# --- dev account ---
terraform init
terraform workspace new dev
terraform apply -var="project_name=boilerplate-template" -var="environment=dev" -auto-approve
# --- switch to prod account ---
export AWS_PROFILE=ahmax99-prod
terraform workspace new prod
terraform apply -var="project_name=boilerplate-template" -var="environment=prod" -auto-approve
cd ../..
```

Then continue with the environment's GitHub configuration and first apply per [`docs/runbook.md`](../../../docs/runbook.md) — no further local `terraform apply` is needed (open a PR → plan comment → merge applies dev → `v*` tag applies prod).

## Security Features

✅ **S3 Bucket**:

- Versioning enabled (recover from accidental deletions)
- Server-side encryption (AES256)
- Public access blocked
- Native S3 locking (`.tflock` files created automatically)
- No lifecycle policies (keep all state versions)

## Cleanup

⚠️ **DO NOT destroy an environment's bucket while that environment is using it!**

To destroy one environment's bucket (only once you're completely done with that environment):

```bash
terraform workspace select dev   # or prod
terraform destroy -var="project_name=boilerplate-template" -var="environment=dev"
```
