output "application_arn" {
  description = "ARN of the CodeDeploy application"
  value       = aws_codedeploy_app.lambda.arn
}

output "deployment_group_arn" {
  description = "ARN of the CodeDeploy deployment group"
  value       = aws_codedeploy_deployment_group.lambda.arn
}
