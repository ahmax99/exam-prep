variable "project_name" {
  description = "Vercel project name"
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
