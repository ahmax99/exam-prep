locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  name_prefix = "${var.project_name}-${var.environment}"

  # Central ECR (shared-services account, repos created by the org repo — env-agnostic names)
  ecr_registry                = "${var.central_ecr_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
  ecr_backend_repository_url  = "${local.ecr_registry}/${var.project_name}-backend"
  ecr_frontend_repository_url = "${local.ecr_registry}/${var.project_name}-frontend"
  ecr_backend_repository_arn  = "arn:aws:ecr:${var.aws_region}:${var.central_ecr_account_id}:repository/${var.project_name}-backend"
  ecr_frontend_repository_arn = "arn:aws:ecr:${var.aws_region}:${var.central_ecr_account_id}:repository/${var.project_name}-frontend"

  # Prod lives directly under the apex; dev under the org-delegated dev.<root> zone
  domain_name = var.environment == "prod" ? "${var.project_name}.${var.root_domain}" : "${var.project_name}.${var.environment}.${var.root_domain}"

  # Prod resolves the apex zone cross-account (aws.dns); dev's env zone lives in the dev account itself
  dns_zone_id = var.environment == "prod" ? data.aws_route53_zone.main[0].zone_id : data.aws_route53_zone.env[0].zone_id

  # App origins
  frontend_url      = "https://${local.domain_name}"
  dev_localhost_url = "http://localhost:3000"

  # S3 bucket names
  s3_uploads_bucket_name       = "${local.name_prefix}-uploads"
  s3_logs_bucket_name          = "${local.name_prefix}-logs"
  s3_static_assets_bucket_name = "${local.name_prefix}-static-assets"
  s3_maintenance_bucket_name   = "${local.name_prefix}-maintenance"

  # CloudFront distribution ARN
  cloudfront_distribution_arn = module.cloudfront.distribution_arn

  # OIDC subject the app-deploy role trusts
  github_repo_ref       = "repo:${var.github_org}@${var.github_org_id}/${var.project_name}@${var.github_repo_id}"
  github_deploy_subject = var.environment == "prod" ? "${local.github_repo_ref}:environment:prod" : "${local.github_repo_ref}:*"

  # Maintenance switch
  provisioned_concurrent_executions = var.maintenance_mode ? 0 : local.env.provisioned_concurrent_executions

  # Per-environment hardening config
  env_config = {
    dev = {
      log_retention_days                = 7
      reserved_concurrent_executions    = -1
      provisioned_concurrent_executions = 0
      deployment_config_name            = "CodeDeployDefault.LambdaAllAtOnce"
      enable_alarms                     = false
      cognito_deletion_protection       = "INACTIVE"
      s3_logs_expiration_days           = 7
    }
    prod = {
      log_retention_days                = 30
      reserved_concurrent_executions    = 10
      provisioned_concurrent_executions = 2
      deployment_config_name            = "CodeDeployDefault.LambdaCanary10Percent5Minutes"
      enable_alarms                     = true
      cognito_deletion_protection       = "ACTIVE"
      s3_logs_expiration_days           = 90
    }
  }

  env = local.env_config[var.environment]
}
