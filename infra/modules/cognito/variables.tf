variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
}

variable "user_pool_domain" {
  description = "Domain prefix for Cognito Hosted UI"
  type        = string
}

variable "app_client_name" {
  description = "Name of the Cognito User Pool App Client"
  type        = string
}

variable "callback_urls" {
  description = "List of allowed callback URLs for OAuth flow"
  type        = list(string)
}

variable "logout_urls" {
  description = "List of allowed logout URLs"
  type        = list(string)
}

variable "password_policy" {
  description = "Password policy configuration"
  type = object({
    minimum_length                   = number
    require_lowercase                = bool
    require_uppercase                = bool
    require_numbers                  = bool
    require_symbols                  = bool
    temporary_password_validity_days = number
  })
  default = {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }
}

variable "mfa_configuration" {
  description = "MFA configuration: OFF, ON, or OPTIONAL"
  type        = string

  validation {
    condition     = contains(["OFF", "ON", "OPTIONAL"], var.mfa_configuration)
    error_message = "MFA configuration must be OFF, ON, or OPTIONAL"
  }
}

variable "email_configuration" {
  description = "Email configuration for Cognito"
  type = object({
    email_sending_account = string
    source_arn            = string
    from_email_address    = string
  })
  default = {
    email_sending_account = "COGNITO_DEFAULT"
    source_arn            = ""
    from_email_address    = ""
  }
}

variable "advanced_security_mode" {
  description = "Advanced security mode: OFF, AUDIT, or ENFORCED"
  type        = string

  validation {
    condition     = contains(["OFF", "AUDIT", "ENFORCED"], var.advanced_security_mode)
    error_message = "Advanced security mode must be OFF, AUDIT, or ENFORCED"
  }
}

variable "deletion_protection" {
  description = "Enable deletion protection for user pool"
  type        = string

  validation {
    condition     = contains(["ACTIVE", "INACTIVE"], var.deletion_protection)
    error_message = "Deletion protection must be ACTIVE or INACTIVE"
  }
}

variable "token_validity" {
  description = "Token validity configuration"
  type = object({
    id_token_validity      = number
    access_token_validity  = number
    refresh_token_validity = number
    id_token_unit          = string
    access_token_unit      = string
    refresh_token_unit     = string
  })
  default = {
    id_token_validity      = 60
    access_token_validity  = 60
    refresh_token_validity = 30
    id_token_unit          = "minutes"
    access_token_unit      = "minutes"
    refresh_token_unit     = "days"
  }
}

variable "generate_client_secret" {
  description = "Generate client secret for app client (set to false for public clients using PKCE)"
  type        = bool
}


variable "enable_google_oauth" {
  description = "Enable Google OAuth identity provider"
  type        = bool
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
}
