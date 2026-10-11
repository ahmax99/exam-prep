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

module "route53" {
  source = "./modules/route53"

  providers = {
    aws = aws.dns
  }

  zone_id = local.dns_zone_id
  cname_records = {
    app = {
      name   = local.domain_name
      target = local.vercel_cname_target
    }
  }
}

module "iam" {
  source = "./modules/iam"

  role_name                = "${local.name_prefix}-vercel-runtime"
  vercel_oidc_provider_arn = data.aws_iam_openid_connect_provider.vercel.arn
  vercel_team              = var.vercel_team
  vercel_project_name      = local.vercel_project_name
  s3_uploads_bucket_arn    = module.s3_uploads.bucket_arn
}

module "vercel" {
  source = "./modules/vercel"

  project_name    = local.vercel_project_name
  root_directory  = local.app_root_directory
  domain_name     = local.domain_name
  function_region = local.vercel_function_region

  environment_variables = {
    S3_BUCKET_NAME = module.s3_uploads.bucket_name
    AWS_REGION     = var.aws_region
    AWS_ROLE_ARN   = module.iam.vercel_runtime_role_arn
  }
  database_url = var.database_url
}
