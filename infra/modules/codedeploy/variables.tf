variable "application_name" {
  description = "Name of the CodeDeploy application"
  type        = string
}

variable "deployment_group_name" {
  description = "Name of the deployment group"
  type        = string
}

variable "lambda_function_arn" {
  description = "ARN of the Lambda function to deploy"
  type        = string
}

variable "create_custom_deployment_config" {
  description = "Whether to create a custom deployment configuration"
  type        = bool
}

variable "deployment_config_name" {
  description = "Name of the deployment configuration to use (if not creating custom)"
  type        = string
}

variable "traffic_routing_type" {
  description = "Type of traffic routing (TimeBasedLinear, TimeBasedCanary, or AllAtOnce)"
  type        = string

  validation {
    condition     = contains(["TimeBasedLinear", "TimeBasedCanary", "AllAtOnce"], var.traffic_routing_type)
    error_message = "Traffic routing type must be TimeBasedLinear, TimeBasedCanary, or AllAtOnce"
  }
}

variable "linear_interval" {
  description = "Number of minutes between each incremental traffic shift for linear deployment"
  type        = number
}

variable "linear_percentage" {
  description = "Percentage of traffic to shift at each interval for linear deployment"
  type        = number
}

variable "canary_interval" {
  description = "Number of minutes before shifting remaining traffic for canary deployment"
  type        = number
}

variable "canary_percentage" {
  description = "Percentage of traffic to shift in the first increment for canary deployment"
  type        = number
}

variable "enable_auto_rollback" {
  description = "Enable automatic rollback on deployment failure or alarm threshold"
  type        = bool
}

variable "auto_rollback_events" {
  description = "Events that trigger automatic rollback"
  type        = list(string)
}

variable "alarm_names" {
  description = "List of CloudWatch alarm names to monitor during deployment"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
}
