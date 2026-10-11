variable "project_name" {
  description = "Vercel project name"
  type        = string
}

variable "git_repository" {
  description = "GitHub repository the project deploys from, as owner/repo"
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$", var.git_repository))
    error_message = "git_repository must be in owner/repo form."
  }
}

variable "production_branch" {
  description = "Git branch whose pushes deploy to production"
  type        = string
}

variable "root_directory" {
  description = "Path of the app inside the repository"
  type        = string
}

variable "domain_name" {
  description = "Custom production domain"
  type        = string
}

variable "function_region" {
  description = "Vercel region the serverless functions run in"
  type        = string
}

variable "environment_variables" {
  description = "Non-secret production environment variables"
  type        = map(string)
}

variable "database_url" {
  description = "Postgres connection string for the production environment"
  type        = string
  sensitive   = true
  ephemeral   = true
}
