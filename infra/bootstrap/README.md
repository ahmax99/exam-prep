# Terraform Backend Bootstrap

This directory contains the Terraform configuration to create the **S3 state bucket** for this repo's single environment (`exam-prep-prod-terraform-state`), holding its state at the bucket root (`terraform.tfstate`, no key prefix needed since the bucket itself is the environment boundary).

## Purpose

Creates the following resources:

- **S3 Bucket**: Stores prod's Terraform state with native S3 locking

This is the **only** resource the bring-up creates outside the CI pipeline. Everything else the pipeline needs to authenticate — the GitHub OIDC provider and the per-account `gha-plan`/`gha-deploy` roles — is provided by the org repo (see [`docs/runbook.md`](../../../docs/runbook.md)), so there is no OIDC/role seeding step here anymore.

## Prerequisites

1. CLI credentials via the org's IAM Identity Center (SSO) — set `AWS_PROFILE` to the target account (`ahmax99-prod`) and run `aws sso login`. The one-time `~/.aws/config` block and account IDs live in the [org repo's CLI-access section](https://github.com/ahmax99/ahmax99-aws-org#cli-access-identity-center-sso).
2. Terraform >= 1.14.0 installed

## Important Notes

⚠️ **This configuration uses LOCAL state** (not remote S3 backend) because it creates the backend resource itself.

⚠️ **Keep the `terraform.tfstate` file safe** - it's stored locally in this directory.

## Setup Instructions

```bash
export AWS_PROFILE=ahmax99-prod
aws sso login
cd infra/bootstrap
terraform init
terraform apply -var="project_name=exam-prep" -var="environment=prod" -auto-approve
cd ../..
```

Then continue with prod's GitHub configuration and first apply per [`docs/runbook.md`](../../../docs/runbook.md) — no further local `terraform apply` is needed (open a PR → plan comment → merge to `main` applies prod).

## Security Features

✅ **S3 Bucket**:

- Versioning enabled (recover from accidental deletions)
- Server-side encryption (AES256)
- Public access blocked
- Native S3 locking (`.tflock` files created automatically)
- No lifecycle policies (keep all state versions)

## Cleanup

⚠️ **DO NOT destroy the bucket while prod is using it!**

```bash
terraform destroy -var="project_name=exam-prep" -var="environment=prod"
```
