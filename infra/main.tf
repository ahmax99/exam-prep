module "s3_uploads" {
  source = "./modules/s3"

  bucket_name = local.s3_uploads_bucket_name

  enable_versioning    = true
  enforce_https        = true
  enable_encryption    = true
  block_public_access  = true
  enable_acl           = false
  enable_cors          = true
  cors_allowed_origins = [local.frontend_url, local.dev_localhost_url]
  cors_allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
  cors_allowed_headers = ["*"]
  cors_max_age_seconds = 3600

  enable_access_logging = false
  logging_target_bucket = ""
  logging_target_prefix = ""

  lifecycle_rules = [
    {
      id                            = "delete-old-versions"
      enabled                       = true
      noncurrent_version_expiration = 30
    }
  ]

  tags = merge(
    local.common_tags,
    {
      Name = local.s3_uploads_bucket_name
    }
  )
}

module "database_secret" {
  source = "./modules/secret-manager"

  secret_name          = "${local.name_prefix}/database-url"
  secret_description   = "Database connection URL for ${var.environment} environment"
  secret_value         = var.database_url
  recovery_window_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-database-url"
    }
  )
}

module "iam" {
  source = "./modules/iam"

  aws_region            = var.aws_region
  s3_uploads_bucket_arn = module.s3_uploads.bucket_arn
  database_secret_arn   = module.database_secret.secret_arn

  tags = merge(
    local.common_tags,
    {
      Name = local.name_prefix
    }
  )
}

module "amplify" {
  source = "./modules/amplify"

  github_org          = var.github_org
  github_access_token = var.github_access_token
  branch_name         = local.branch_name
  root_domain         = var.root_domain
  domain_name         = local.domain_name

  ssr_compute_role_arn   = module.iam.ssr_compute_role_arn
  build_service_role_arn = module.iam.build_service_role_arn
  database_secret_name   = module.database_secret.secret_name
  s3_uploads_bucket_name = module.s3_uploads.bucket_name

  tags = merge(
    local.common_tags,
    {
      Name = local.name_prefix
    }
  )
}

module "route53" {
  source = "./modules/route53"

  providers = {
    aws = aws.dns
  }

  zone_id       = local.dns_zone_id
  cname_records = module.amplify.dns_records
}

module "waf" {
  source = "./modules/waf"

  providers = {
    aws = aws.waf
  }

  resource_arn = module.amplify.app_arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-waf"
    }
  )
}
