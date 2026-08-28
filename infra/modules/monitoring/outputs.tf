output "backend_alarm_names" {
  description = "Backend alias alarm names for CodeDeploy alarm_configuration"
  value       = [for k, alarm in aws_cloudwatch_metric_alarm.this : alarm.alarm_name if startswith(k, "backend-")]
}

output "frontend_alarm_names" {
  description = "Frontend alias alarm names for CodeDeploy alarm_configuration"
  value       = [for k, alarm in aws_cloudwatch_metric_alarm.this : alarm.alarm_name if startswith(k, "frontend-")]
}
