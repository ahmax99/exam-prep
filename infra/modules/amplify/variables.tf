variable "github_org" {
  description = "GitHub owner of the repository Amplify connects to"
  type        = string
}

variable "github_access_token" {
  description = "GitHub fine-grained personal access token used once to create Amplify's webhook — scope to this repo only, with Contents: Read-only, Metadata: Read-only, Webhooks: Read and write"
  type        = string
  sensitive   = true
}

variable "ssr_compute_role_arn" {
  description = "IAM role Amplify assumes per-request at runtime (compute_role_arn)"
  type        = string
}

variable "build_service_role_arn" {
  description = "IAM role Amplify assumes during the build (iam_service_role_arn)"
  type        = string
}

variable "domain_name" {
  description = "Full app domain (project.root_domain), used for the BASE_URL environment variable"
  type        = string
}

variable "database_secret_name" {
  description = "Name of the Secrets Manager secret holding the database connection URL"
  type        = string
}

variable "s3_uploads_bucket_name" {
  description = "Name of the S3 bucket the app reads uploaded objects from"
  type        = string
}

variable "branch_name" {
  description = "Git branch Amplify builds and deploys from"
  type        = string
}

variable "root_domain" {
  description = "Root domain (Route 53 hosted zone name) for the domain association"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources — must include a \"Name\" key, used as the Amplify app's name"
  type        = map(string)

  validation {
    condition     = contains(keys(var.tags), "Name")
    error_message = "tags must include a \"Name\" key — it's used as the Amplify app's name."
  }
}
