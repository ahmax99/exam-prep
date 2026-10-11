output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "vercel_project_id" {
  description = "Vercel project ID"
  value       = module.vercel.project_id
}
