variable "role_name" {
  description = "Name of the IAM role the Vercel functions assume"
  type        = string
}

variable "vercel_oidc_provider_arn" {
  description = "ARN of the account's Vercel OIDC identity provider (team issuer mode)"
  type        = string

  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:oidc-provider/oidc\\.vercel\\.com/.+$", var.vercel_oidc_provider_arn))
    error_message = "vercel_oidc_provider_arn must be an oidc.vercel.com IAM OIDC provider ARN."
  }
}

variable "vercel_team" {
  description = "Vercel team slug the OIDC token is issued for"
  type        = string
}

variable "vercel_project_name" {
  description = "Vercel project allowed to assume the role"
  type        = string
}

variable "s3_uploads_bucket_arn" {
  description = "ARN of the question-images bucket the app reads from"
  type        = string
}
