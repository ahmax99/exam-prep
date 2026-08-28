variable "name_prefix" {
  description = "Resource name prefix (<project>-<environment>) for alarm names"
  type        = string
}

variable "backend_function_name" {
  description = "Backend Lambda function name to alarm on"
  type        = string
}

variable "backend_alias_name" {
  description = "Backend Lambda alias name (the alias CodeDeploy shifts traffic on)"
  type        = string
}

variable "frontend_function_name" {
  description = "Frontend Lambda function name to alarm on"
  type        = string
}

variable "frontend_alias_name" {
  description = "Frontend Lambda alias name (the alias CodeDeploy shifts traffic on)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
