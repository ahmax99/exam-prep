variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "enable_versioning" {
  description = "Enable versioning for the S3 bucket"
  type        = bool
}

variable "enable_encryption" {
  description = "Enable server-side encryption"
  type        = bool
}

variable "block_public_access" {
  description = "Block all public access to the bucket"
  type        = bool
}

variable "enable_cors" {
  description = "Enable CORS configuration"
  type        = bool
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
}

variable "cors_allowed_methods" {
  description = "List of allowed methods for CORS"
  type        = list(string)
}

variable "cors_allowed_headers" {
  description = "List of allowed headers for CORS"
  type        = list(string)
}

variable "cors_max_age_seconds" {
  description = "Max age in seconds for CORS preflight requests"
  type        = number
}

variable "enable_access_logging" {
  description = "Enable S3 access logging"
  type        = bool
}

variable "logging_target_bucket" {
  description = "Target bucket for access logs (required if enable_access_logging is true)"
  type        = string
}

variable "logging_target_prefix" {
  description = "Prefix for access log objects"
  type        = string
}

variable "lifecycle_rules" {
  description = "List of lifecycle rules for the bucket"
  type = list(object({
    id                            = string
    enabled                       = bool
    expiration_days               = optional(number)
    noncurrent_version_expiration = optional(number)
    transition_days               = optional(number)
    transition_storage_class      = optional(string)
  }))
}

variable "enforce_https" {
  description = "Deny all non-HTTPS (HTTP) requests to the bucket"
  type        = bool
}

variable "enable_acl" {
  description = "Enable ACL on the bucket (required for CloudFront access logging)"
  type        = bool
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
