variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "image_uri" {
  description = "ECR image URI for container-based Lambda"
  type        = string
}

variable "ecr_repository_arn" {
  description = "ARN of the ECR repository the Lambda function pulls its image from"
  type        = string
}

variable "memory_size" {
  description = "Amount of memory in MB for Lambda function"
  type        = number
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions for the Lambda function"
  type        = number
}

variable "provisioned_concurrent_executions" {
  description = "Provisioned (pre-warmed) concurrency on the alias to avoid cold starts. 0 disables it (no resource, no cost). Must be <= reserved_concurrent_executions when reserved is a positive value."
  type        = number

  validation {
    condition     = var.provisioned_concurrent_executions >= 0
    error_message = "provisioned_concurrent_executions must be >= 0"
  }
}

variable "s3_bucket_name" {
  description = "S3 bucket name for file uploads. If null, no S3 access policy is created."
  type        = string
  nullable    = true
}

variable "secrets_arns" {
  description = "List of Secrets Manager ARNs to grant access to"
  type        = list(string)
}

variable "cognito_user_pool_arn" {
  description = "Cognito user pool ARN to grant admin permissions on (e.g. for assigning users to groups)."
  type        = string
}

variable "cognito_actions" {
  description = "Cognito Identity Provider admin actions to grant on cognito_user_pool_arn; each caller should list only the actions it actually invokes."
  type        = list(string)
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
}

variable "enable_function_url" {
  description = "Enable Lambda Function URL"
  type        = bool
}

variable "cors_allow_origins" {
  description = "CORS allowed origins for Function URL"
  type        = list(string)
}

variable "cors_allow_methods" {
  description = "CORS allowed methods for Function URL"
  type        = list(string)
}

variable "cors_allow_headers" {
  description = "CORS allowed headers for Function URL"
  type        = list(string)
}

variable "cors_max_age" {
  description = "CORS max age for Function URL"
  type        = number
}

variable "create_alias" {
  description = "Whether to create a Lambda alias for blue/green deployments"
  type        = bool
}

variable "alias_name" {
  description = "Name of the Lambda alias"
  type        = string
}

variable "function_url_auth_type" {
  description = "Authorization type for Lambda Function URL: NONE or AWS_IAM"
  type        = string

  validation {
    condition     = contains(["NONE", "AWS_IAM"], var.function_url_auth_type)
    error_message = "Must be NONE or AWS_IAM"
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
