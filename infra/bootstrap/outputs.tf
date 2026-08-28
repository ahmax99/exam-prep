output "s3_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "backend_config" {
  description = "Backend configuration to use in environment directories"
  value = {
    bucket       = aws_s3_bucket.terraform_state.id
    region       = var.aws_region
    encrypt      = true
    use_lockfile = true
  }
}
