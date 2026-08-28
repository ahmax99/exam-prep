output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}

output "function_url" {
  description = "Lambda Function URL"
  value       = var.enable_function_url ? aws_lambda_function_url.this[0].function_url : null
}

output "alias_name" {
  description = "Name of the Lambda alias"
  value       = var.create_alias ? aws_lambda_alias.this[0].name : null
}

output "alias_arn" {
  description = "ARN of the Lambda alias"
  value       = var.create_alias ? aws_lambda_alias.this[0].arn : null
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda.name
}
