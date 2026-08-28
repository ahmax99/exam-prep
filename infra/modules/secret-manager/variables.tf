variable "secret_name" {
  description = "Name of the secret in Secrets Manager"
  type        = string
}

variable "secret_description" {
  description = "Description of the secret"
  type        = string
}

variable "secret_value" {
  description = "Value of the secret (JSON string for structured secrets)"
  type        = string
  sensitive   = true
}

variable "recovery_window_days" {
  description = "Number of days to retain secret after deletion"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
