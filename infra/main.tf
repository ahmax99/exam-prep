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
  # Empty until the Vercel project lands; its CNAME is wired in here then.
  cname_records = []
}
