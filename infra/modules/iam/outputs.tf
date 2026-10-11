output "vercel_runtime_role_arn" {
  description = "ARN of the role the Vercel functions assume via OIDC (the app's AWS_ROLE_ARN)"
  value       = aws_iam_role.vercel_runtime.arn
}
