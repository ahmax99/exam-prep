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
  description = "Environment this state bucket belongs to — this repo manages a single environment, prod"
  type        = string

  validation {
    condition     = var.environment == "prod"
    error_message = "This repo manages a single environment: prod."
  }
}
