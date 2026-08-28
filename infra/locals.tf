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

  branch_name = "main"
}
