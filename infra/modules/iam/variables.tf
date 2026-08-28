variable "aws_region" {
  description = "Region the Amplify app runs in — the build/SSR compute roles must also trust the region-specific amplify.<region>.amazonaws.com principal, not just the global one"
  type        = string
}

variable "s3_uploads_bucket_arn" {
  description = "ARN of the S3 bucket the SSR compute role reads uploaded objects from"
  type        = string
}

variable "database_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the database connection URL"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources — must include a \"Name\" key, used to derive the two IAM role names"
  type        = map(string)

  validation {
    condition     = contains(keys(var.tags), "Name")
    error_message = "tags must include a \"Name\" key — it's used to derive the IAM role names."
  }
}
