variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming and tagging — also the GitHub repo name and the app's domain subdomain prefix"
  type        = string
}

variable "environment" {
  description = "Environment name — this repo runs a single environment, prod"
  type        = string

  validation {
    condition     = var.environment == "prod"
    error_message = "This repo manages a single environment: prod."
  }
}

variable "root_domain" {
  description = "Root domain (Route 53 hosted zone name) the app's domain is derived from"
  type        = string
}

variable "dns_account_role_arn" {
  description = "IAM role ARN to assume in the AWS account hosting the root Route 53 zone for cross-account DNS writes; empty string when the zone lives in this same account"
  type        = string

  validation {
    condition     = can(regex("^$|^arn:aws:iam::[0-9]{12}:role/.+$", var.dns_account_role_arn))
    error_message = "dns_account_role_arn must be a valid IAM role ARN or empty."
  }
}

variable "github_owner" {
  description = "GitHub owner of this repository — the Vercel project deploys from <github_owner>/<project_name>"
  type        = string
}

variable "vercel_team" {
  description = "Vercel team slug (the path segment in vercel.com/<slug>) — provider scope and the Vercel OIDC issuer/audience"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*$", var.vercel_team))
    error_message = "vercel_team must be a Vercel team slug (lowercase letters, digits, hyphens)."
  }
}

variable "database_url" {
  description = "Neon production connection string, sent to Vercel as a write-only value so it never lands in state"
  type        = string
  sensitive   = true
  ephemeral   = true

  # An unset secret arrives as "", which would ship a blank DATABASE_URL to Vercel.
  validation {
    condition     = can(regex("^postgres(ql)?://", var.database_url))
    error_message = "database_url must be a postgres:// or postgresql:// connection string; check the TF_VAR_database_url secret."
  }
}
