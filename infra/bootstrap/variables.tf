variable "aws_region" {
  description = "AWS region for backend resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name — must match the main root module's var.project_name"
  type        = string
}

variable "environment" {
  description = "Environment this state bucket belongs to (dev, prod) — each environment gets its own dedicated bucket"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod"
  }
}
