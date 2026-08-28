output "ssr_compute_role_arn" {
  description = "ARN of the Amplify SSR compute role (compute_role_arn on aws_amplify_app)"
  value       = aws_iam_role.ssr_compute.arn
}

output "build_service_role_arn" {
  description = "ARN of the Amplify build-time service role (iam_service_role_arn on aws_amplify_app)"
  value       = aws_iam_role.build_service.arn
}
