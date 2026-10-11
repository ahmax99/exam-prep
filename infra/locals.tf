locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  name_prefix = "${var.project_name}-${var.environment}"

  domain_name = "${var.project_name}.${var.root_domain}"

  dns_zone_id = data.aws_route53_zone.main.zone_id

  frontend_url      = "https://${local.domain_name}"
  dev_localhost_url = "http://localhost:3000"

  s3_uploads_bucket_name = "${local.name_prefix}-uploads"

  vercel_project_name = var.project_name
  app_root_directory  = "apps/nextjs"
  production_branch   = "main"
  vercel_cname_target = "cname.vercel-dns.com"

  # Functions run next to the S3 bucket and Neon so each query stays in-region.
  vercel_region_by_aws_region = {
    "ap-northeast-1" = "hnd1"
    "us-east-1"      = "iad1"
    "eu-west-1"      = "dub1"
  }
  vercel_function_region = local.vercel_region_by_aws_region[var.aws_region]
}
