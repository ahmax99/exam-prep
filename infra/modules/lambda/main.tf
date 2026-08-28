# -------------------
# IAM Role and Policies
# -------------------
resource "aws_iam_role" "lambda" {
  name = "${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "s3_access" {
  count = var.s3_bucket_name != null ? 1 : 0
  name  = "${var.function_name}-s3-policy"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3BucketAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "cognito_admin" {
  name = "${var.function_name}-cognito-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowCognitoUserPoolAdmin"
        Effect   = "Allow"
        Action   = var.cognito_actions
        Resource = var.cognito_user_pool_arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "secrets_access" {
  count = length(var.secrets_arns) > 0 ? 1 : 0
  name  = "${var.function_name}-secrets-policy"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.secrets_arns
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecr_access" {
  count = 1
  name  = "${var.function_name}-ecr-policy"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECRImagePull"
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = var.ecr_repository_arn
      }
    ]
  })
}

# -------------------
# CloudWatch Log Group
# -------------------
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# -------------------
# Lambda Function
# -------------------
resource "aws_lambda_function" "this" {
  function_name = var.function_name
  role          = aws_iam_role.lambda.arn

  package_type = "Image"
  image_uri    = var.image_uri
  publish      = true

  memory_size = var.memory_size
  timeout     = var.timeout

  reserved_concurrent_executions = var.reserved_concurrent_executions

  environment {
    variables = var.environment_variables
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda
  ]

  tags = var.tags
}

resource "aws_lambda_function_url" "this" {
  count = var.enable_function_url ? 1 : 0

  function_name      = aws_lambda_function.this.function_name
  qualifier          = var.create_alias ? aws_lambda_alias.this[0].name : null
  authorization_type = var.function_url_auth_type

  cors {
    allow_origins = var.cors_allow_origins
    allow_methods = var.cors_allow_methods
    allow_headers = var.cors_allow_headers
    max_age       = var.cors_max_age
  }

  depends_on = [aws_lambda_alias.this]
}

# -------------------
# Lambda Alias
# -------------------
resource "aws_lambda_alias" "this" {
  count = var.create_alias ? 1 : 0

  name             = var.alias_name
  function_name    = aws_lambda_function.this.function_name
  function_version = aws_lambda_function.this.version # Initial version - CodeDeploy will manage updates

  lifecycle {
    ignore_changes = [function_version]
  }
}

# -------------------
# Provisioned Concurrency (alias-qualified)
# -------------------
resource "aws_lambda_provisioned_concurrency_config" "this" {
  count = var.create_alias && var.provisioned_concurrent_executions > 0 ? 1 : 0

  function_name                     = aws_lambda_function.this.function_name
  qualifier                         = aws_lambda_alias.this[0].name
  provisioned_concurrent_executions = var.provisioned_concurrent_executions
}
