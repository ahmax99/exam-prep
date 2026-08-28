# -------------------
# Route 53
# -------------------
module "route53" {
  source = "./modules/route53"

  providers = {
    aws = aws.dns
  }

  zone_id                             = local.dns_zone_id
  domain_name                         = local.domain_name
  cloudfront_distribution_domain_name = module.cloudfront.distribution_domain_name
  cloudfront_hosted_zone_id           = module.cloudfront.hosted_zone_id
}

# -------------------
# ACM Certificate
# -------------------
module "acm" {
  source = "./modules/acm"

  providers = {
    aws     = aws.us_east_1
    aws.dns = aws.dns
  }

  domain_name               = local.domain_name
  subject_alternative_names = []
  zone_id                   = local.dns_zone_id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-acm"
    }
  )
}

# -------------------
# CloudFront
# -------------------
module "cloudfront" {
  source = "./modules/cloudfront"

  name_prefix = local.name_prefix

  frontend_function_url = module.frontend.function_url
  backend_function_url  = module.backend.function_url

  static_assets_bucket_domain_name = module.s3_static_assets.bucket_regional_domain_name
  static_assets_bucket_id          = module.s3_static_assets.bucket_id
  logs_bucket_domain_name          = module.s3_logs.bucket_regional_domain_name
  web_acl_id                       = one(module.waf[*].web_acl_arn)

  maintenance_mode               = var.maintenance_mode
  maintenance_bucket_domain_name = module.s3_maintenance.bucket_regional_domain_name
  maintenance_bucket_id          = module.s3_maintenance.bucket_id

  domain_name                    = local.domain_name
  acm_certificate_arn            = module.acm.certificate_arn
  lambda_edge_viewer_request_arn = module.lambda_edge.qualified_arn
  lambda_edge_origin_request_arn = module.lambda_edge.signer_qualified_arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-cloudfront"
    }
  )
}

# -------------------
# Lambda@Edge — restricts access to custom domain only
# -------------------
module "lambda_edge" {
  source = "./modules/lambda-edge"

  providers = {
    aws = aws.us_east_1
  }

  name_prefix                 = local.name_prefix
  allowed_hosts               = [local.domain_name]
  cloudfront_distribution_arn = local.cloudfront_distribution_arn

  signer_region           = var.aws_region
  frontend_function_arn   = module.frontend.function_arn
  frontend_function_alias = module.frontend.alias_name

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-edge"
    }
  )
}

# -------------------
# WAF
# -------------------
module "waf" {
  source = "./modules/waf"
  count  = var.maintenance_mode ? 0 : 1

  providers = {
    aws = aws.us_east_1
  }

  name_prefix = local.name_prefix

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-waf"
    }
  )
}

module "lambda_permissions" {
  source = "./modules/lambda-permissions"

  backend_function_name       = module.backend.function_name
  backend_function_arn        = module.backend.function_arn
  backend_alias_name          = module.backend.alias_name
  frontend_function_name      = module.frontend.function_name
  frontend_alias_name         = module.frontend.alias_name
  frontend_lambda_role_arn    = module.frontend.lambda_role_arn
  frontend_lambda_role_name   = module.frontend.lambda_role_name
  cloudfront_distribution_arn = local.cloudfront_distribution_arn
  edge_signer_role_arn        = module.lambda_edge.edge_role_arn
}

# -------------------
# Cognito
# -------------------
module "cognito" {
  source = "./modules/cognito"

  user_pool_name   = "${local.name_prefix}-user-pool"
  user_pool_domain = local.name_prefix
  app_client_name  = "${local.name_prefix}-web-app-client"

  callback_urls = [
    "${local.frontend_url}/api/auth/callback",
    "${local.dev_localhost_url}/api/auth/callback",
  ]
  logout_urls = [
    local.frontend_url,
    local.dev_localhost_url,
  ]

  password_policy = {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  mfa_configuration      = "OPTIONAL"
  advanced_security_mode = "OFF"
  deletion_protection    = local.env.cognito_deletion_protection

  token_validity = {
    id_token_validity      = 60
    access_token_validity  = 60
    refresh_token_validity = 30
    id_token_unit          = "minutes"
    access_token_unit      = "minutes"
    refresh_token_unit     = "days"
  }

  generate_client_secret = false

  enable_google_oauth  = true
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-cognito"
    }
  )
}

# -------------------
# Lambda
# -------------------
module "backend" {
  source = "./modules/lambda"

  function_name      = "${local.name_prefix}-backend"
  image_uri          = "${local.ecr_backend_repository_url}:latest"
  ecr_repository_arn = local.ecr_backend_repository_arn

  memory_size                       = 512
  timeout                           = 30
  log_retention_days                = local.env.log_retention_days
  reserved_concurrent_executions    = local.env.reserved_concurrent_executions
  provisioned_concurrent_executions = local.provisioned_concurrent_executions

  s3_bucket_name        = local.s3_uploads_bucket_name
  cognito_user_pool_arn = module.cognito.user_pool_arn
  cognito_actions       = ["cognito-idp:AdminDeleteUser"]

  secrets_arns = [
    module.database_secret.secret_arn
  ]

  environment_variables = {
    BACKEND_PORT             = "4000"
    COGNITO_CLIENT_ID        = module.cognito.client_id
    COGNITO_USERPOOL_ID      = module.cognito.user_pool_id
    DATABASE_URL_SECRET_NAME = module.database_secret.secret_name
    FRONTEND_URL             = local.frontend_url
    NODE_ENV                 = "production"
    S3_BUCKET_NAME           = local.s3_uploads_bucket_name
    SENTRY_DSN               = var.backend_sentry_dsn
  }

  enable_function_url    = true
  function_url_auth_type = "AWS_IAM"
  cors_allow_origins     = [local.frontend_url]
  cors_allow_methods     = ["*"]
  cors_allow_headers     = ["Content-Type", "Authorization", "Accept", "X-Id-Token"]
  cors_max_age           = 86400

  create_alias = true
  alias_name   = var.environment

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-backend"
    }
  )
}

module "frontend" {
  source = "./modules/lambda"

  function_name      = "${local.name_prefix}-frontend"
  image_uri          = "${local.ecr_frontend_repository_url}:latest"
  ecr_repository_arn = local.ecr_frontend_repository_arn

  memory_size                       = 512
  timeout                           = 30
  log_retention_days                = local.env.log_retention_days
  reserved_concurrent_executions    = local.env.reserved_concurrent_executions
  provisioned_concurrent_executions = local.provisioned_concurrent_executions

  s3_bucket_name        = null
  cognito_user_pool_arn = module.cognito.user_pool_arn
  cognito_actions = [
    "cognito-idp:AdminAddUserToGroup",
    "cognito-idp:AdminListGroupsForUser"
  ]

  secrets_arns = []

  environment_variables = {
    BACKEND_INTERNAL_URL = "${trimsuffix(module.backend.function_url, "/")}/api/v1"
    BASE_URL             = local.frontend_url
    COGNITO_CLIENT_ID    = module.cognito.client_id
    COGNITO_DOMAIN       = module.cognito.user_pool_domain
    COGNITO_USERPOOL_ID  = module.cognito.user_pool_id
    CONTACT_TO_EMAIL     = var.contact_to_email
    FROM_EMAIL           = var.from_email
    NODE_ENV             = "production"
    RESEND_API_KEY       = var.resend_api_key
    SENTRY_DSN           = var.frontend_sentry_dsn
    SESSION_SECRET       = var.session_secret
  }

  enable_function_url    = true
  function_url_auth_type = "AWS_IAM"
  cors_allow_origins     = [local.frontend_url]
  cors_allow_methods     = ["*"]
  cors_allow_headers     = ["Content-Type", "Authorization", "Accept", "X-Id-Token"]
  cors_max_age           = 86400

  create_alias = true
  alias_name   = var.environment

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-frontend"
    }
  )
}

# -------------------
# Secret Manager
# -------------------
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

# -------------------
# S3 Buckets
# -------------------
module "s3_logs" {
  source = "./modules/s3"

  bucket_name = local.s3_logs_bucket_name

  enable_versioning     = false
  enforce_https         = true
  enable_encryption     = true
  block_public_access   = true
  enable_acl            = true
  enable_cors           = false
  cors_allowed_origins  = []
  cors_allowed_methods  = []
  cors_allowed_headers  = []
  cors_max_age_seconds  = 0
  enable_access_logging = false
  logging_target_bucket = ""
  logging_target_prefix = ""

  lifecycle_rules = [
    {
      id              = "expire-old-logs"
      enabled         = true
      expiration_days = local.env.s3_logs_expiration_days
    }
  ]

  tags = merge(
    local.common_tags,
    {
      Name = local.s3_logs_bucket_name
    }
  )
}

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

  enable_access_logging = true
  logging_target_bucket = module.s3_logs.bucket_id
  logging_target_prefix = "uploads/"

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

module "s3_static_assets" {
  source = "./modules/s3"

  bucket_name = local.s3_static_assets_bucket_name

  enable_versioning     = false
  enforce_https         = false
  enable_encryption     = true
  block_public_access   = true
  enable_acl            = false
  enable_cors           = false
  cors_allowed_origins  = []
  cors_allowed_methods  = []
  cors_allowed_headers  = []
  cors_max_age_seconds  = 0
  enable_access_logging = true
  logging_target_bucket = module.s3_logs.bucket_id
  logging_target_prefix = "static-assets/"

  lifecycle_rules = []

  tags = merge(
    local.common_tags,
    {
      Name = local.s3_static_assets_bucket_name
    }
  )
}

module "s3_maintenance" {
  source = "./modules/s3"

  bucket_name = local.s3_maintenance_bucket_name

  enable_versioning     = false
  enforce_https         = false
  enable_encryption     = true
  block_public_access   = true
  enable_acl            = false
  enable_cors           = false
  cors_allowed_origins  = []
  cors_allowed_methods  = []
  cors_allowed_headers  = []
  cors_max_age_seconds  = 0
  enable_access_logging = false
  logging_target_bucket = ""
  logging_target_prefix = ""

  lifecycle_rules = []

  tags = merge(
    local.common_tags,
    {
      Name = local.s3_maintenance_bucket_name
    }
  )
}

resource "aws_s3_object" "maintenance_index" {
  bucket       = module.s3_maintenance.bucket_id
  key          = "index.html"
  source       = "${path.module}/assets/maintenance/index.html"
  etag         = filemd5("${path.module}/assets/maintenance/index.html")
  content_type = "text/html"

  tags = local.common_tags
}


# -------------------
# Monitoring — CloudWatch alarms that gate CodeDeploy canary rollback
# -------------------
module "monitoring" {
  source = "./modules/monitoring"
  count  = local.env.enable_alarms ? 1 : 0

  name_prefix            = local.name_prefix
  backend_function_name  = module.backend.function_name
  backend_alias_name     = module.backend.alias_name
  frontend_function_name = module.frontend.function_name
  frontend_alias_name    = module.frontend.alias_name

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-monitoring"
    }
  )
}

# -------------------
# GitHub app-deploy role
# -------------------
module "app_deploy_role" {
  source = "./modules/github-deploy-role"

  role_name      = "${local.name_prefix}-app-deploy"
  github_subject = local.github_deploy_subject

  lambda_function_arns             = [module.backend.function_arn, module.frontend.function_arn]
  codedeploy_application_arns      = [module.codedeploy_backend.application_arn, module.codedeploy_frontend.application_arn]
  codedeploy_deployment_group_arns = [module.codedeploy_backend.deployment_group_arn, module.codedeploy_frontend.deployment_group_arn]
  static_assets_bucket_arn         = module.s3_static_assets.bucket_arn
  cloudfront_distribution_arn      = local.cloudfront_distribution_arn
  ecr_pull_repository_arns         = [local.ecr_backend_repository_arn, local.ecr_frontend_repository_arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-app-deploy"
    }
  )
}

# -------------------
# CodeDeploy
# -------------------
module "codedeploy_backend" {
  source = "./modules/codedeploy"

  application_name      = "${local.name_prefix}-backend"
  deployment_group_name = "${local.name_prefix}-backend-dg"
  lambda_function_arn   = module.backend.function_arn

  create_custom_deployment_config = false
  deployment_config_name          = local.env.deployment_config_name
  traffic_routing_type            = "AllAtOnce"
  linear_interval                 = 1
  linear_percentage               = 10
  canary_interval                 = 5
  canary_percentage               = 10

  enable_auto_rollback = true
  auto_rollback_events = ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
  alarm_names          = local.env.enable_alarms ? module.monitoring[0].backend_alarm_names : []

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-backend-codedeploy"
    }
  )
}

module "codedeploy_frontend" {
  source = "./modules/codedeploy"

  application_name      = "${local.name_prefix}-frontend"
  deployment_group_name = "${local.name_prefix}-frontend-dg"
  lambda_function_arn   = module.frontend.function_arn

  create_custom_deployment_config = false
  deployment_config_name          = local.env.deployment_config_name
  traffic_routing_type            = "AllAtOnce"
  linear_interval                 = 1
  linear_percentage               = 10
  canary_interval                 = 5
  canary_percentage               = 10

  enable_auto_rollback = true
  auto_rollback_events = ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
  alarm_names          = local.env.enable_alarms ? module.monitoring[0].frontend_alarm_names : []

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-frontend-codedeploy"
    }
  )
}

