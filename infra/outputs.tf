output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "amplify_app_id" {
  description = "Amplify app ID"
  value       = module.amplify.app_id
}

output "amplify_default_domain" {
  description = "Amplify's own *.amplifyapp.com fallback domain"
  value       = module.amplify.default_domain
}
