variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "maintenance_mode" {
  description = "Serve the static maintenance page instead of the app. The live state is the MAINTENANCE_MODE GitHub environment variable, flipped by .github/workflows/toggle-maintenance.yml"
  type        = bool
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

variable "database_url" {
  description = "Database connection URL (Neon PostgreSQL)"
  type        = string
  sensitive   = true
}

variable "backend_sentry_dsn" {
  description = "Sentry DSN for the backend's error tracking"
  type        = string
  sensitive   = true
}

variable "frontend_sentry_dsn" {
  description = "Sentry DSN for the frontend's error tracking"
  type        = string
  sensitive   = true
}

variable "contact_to_email" {
  description = "Email address to receive contact form submissions"
  type        = string
}

variable "from_email" {
  description = "Email address for sending emails"
  type        = string
}

variable "resend_api_key" {
  description = "Resend API key for sending emails"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session secret for signing cookies (generated with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

variable "central_ecr_account_id" {
  description = "Account ID of the shared-services account hosting the central ECR repositories (created by the org repo, not this one)"
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.central_ecr_account_id))
    error_message = "central_ecr_account_id must be a 12-digit AWS account ID."
  }
}

variable "github_org" {
  description = "GitHub owner of this repository, for the app-deploy role's OIDC trust subject (CI supplies github.repository_owner)"
  type        = string
}

variable "github_org_id" {
  description = "Numeric GitHub owner ID embedded in the immutable OIDC subject claim (CI supplies github.repository_owner_id)"
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_org_id))
    error_message = "github_org_id must be numeric."
  }
}

variable "github_repo_id" {
  description = "Numeric GitHub repository ID embedded in the immutable OIDC subject claim (CI supplies github.repository_id)"
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_repo_id))
    error_message = "github_repo_id must be numeric."
  }
}
