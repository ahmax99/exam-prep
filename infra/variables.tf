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
