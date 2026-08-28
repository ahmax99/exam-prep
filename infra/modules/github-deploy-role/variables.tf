variable "role_name" {
  description = "Name of the IAM role the app deploy jobs assume"
  type        = string
}

variable "github_subject" {
  description = "Immutable GitHub OIDC sub claim allowed to assume the role (repo:<org>@<org_id>/<repo>@<repo_id>:* for dev, :environment:prod for prod)"
  type        = string
}

variable "lambda_function_arns" {
  description = "Lambda function ARNs the deploy jobs update and publish"
  type        = list(string)
}

variable "codedeploy_application_arns" {
  description = "CodeDeploy application ARNs the deploy jobs create deployments against"
  type        = list(string)
}

variable "codedeploy_deployment_group_arns" {
  description = "CodeDeploy deployment group ARNs the deploy jobs create deployments against"
  type        = list(string)
}

variable "static_assets_bucket_arn" {
  description = "ARN of the S3 bucket the frontend static assets are synced to"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution the deploy jobs invalidate"
  type        = string
}

variable "ecr_pull_repository_arns" {
  description = "Central ECR repository ARNs the deploy role pulls: both the backend and frontend images, plus the frontend image for static-asset extraction"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to the role"
  type        = map(string)
}
