output "qualified_arn" {
  description = "Versioned ARN of the Lambda@Edge function"
  value       = aws_lambda_function.this.qualified_arn
}

output "signer_qualified_arn" {
  description = "Versioned ARN of the Lambda@Edge origin-request SigV4 signer function"
  value       = aws_lambda_function.signer.qualified_arn
}

output "edge_role_arn" {
  description = "ARN of the Lambda@Edge execution role — the principal the origin-request signer authenticates as when it invokes the frontend Function URL"
  value       = aws_iam_role.lambda_edge.arn
}
