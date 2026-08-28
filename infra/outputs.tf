# -------------------
# Common
# -------------------
output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# -------------------
# ECR
# -------------------
output "ecr_backend_repository_url" {
  description = "Central ECR repository URL for backend container images"
  value       = local.ecr_backend_repository_url
}

output "ecr_frontend_repository_url" {
  description = "Central ECR repository URL for frontend container images"
  value       = local.ecr_frontend_repository_url
}

# -------------------
# Backend Lambda
# -------------------
output "backend_function_url" {
  description = "Backend Lambda Function URL for frontend configuration"
  value       = module.backend.function_url
}

output "backend_function_name" {
  description = "Backend Lambda function name for debugging"
  value       = module.backend.function_name
}

output "backend_alias_name" {
  description = "Backend Lambda alias name"
  value       = module.backend.alias_name
}

# -------------------
# Frontend Lambda
# -------------------
output "frontend_function_url" {
  description = "Frontend Lambda Function URL for frontend configuration"
  value       = module.frontend.function_url
}

output "frontend_function_name" {
  description = "Frontend Lambda function name for debugging"
  value       = module.frontend.function_name
}

output "frontend_alias_name" {
  description = "Frontend Lambda alias name"
  value       = module.frontend.alias_name
}

# -------------------
# Cognito
# -------------------
output "cognito_domain" {
  description = "Cognito User Pool domain"
  value       = module.cognito.user_pool_domain
}

# -------------------
# CloudFront
# -------------------
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed for cache invalidation in CI)"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "static_assets_bucket_name" {
  description = "S3 bucket to upload Next.js static assets"
  value       = module.s3_static_assets.bucket_name
}

# -------------------
# App deploy role
# -------------------
output "app_deploy_role_arn" {
  description = "Least-privilege role the app deploy jobs assume (set as APP_DEPLOY_ROLE_ARN)"
  value       = module.app_deploy_role.role_arn
}

