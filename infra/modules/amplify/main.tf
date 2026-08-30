resource "aws_amplify_app" "this" {
  name                 = var.tags["Name"]
  repository           = "https://github.com/${var.github_org}/${local.project_name}"
  access_token         = var.github_access_token
  platform             = "WEB_COMPUTE"
  compute_role_arn     = var.ssr_compute_role_arn
  iam_service_role_arn = var.build_service_role_arn

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "apps/nextjs"
    BASE_URL                  = "https://${var.domain_name}"
    DATABASE_URL_SECRET_NAME  = var.database_secret_name
    NODE_ENV                  = "production"
    S3_BUCKET_NAME            = var.s3_uploads_bucket_name
  }

  cache_config {
    type = "AMPLIFY_MANAGED"
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [access_token]
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.this.id
  branch_name       = var.branch_name
  stage             = "PRODUCTION"
  enable_auto_build = true
  framework         = "Next.js - SSR"

  tags = var.tags
}

resource "aws_amplify_domain_association" "this" {
  app_id      = aws_amplify_app.this.id
  domain_name = var.root_domain

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = local.project_name
  }

  wait_for_verification = false
}
