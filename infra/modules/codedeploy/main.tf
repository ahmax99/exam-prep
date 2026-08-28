# -------------------
# IAM Roles and Policies
# -------------------
resource "aws_iam_role" "codedeploy" {
  name = "${var.application_name}-codedeploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "codedeploy_lambda" {
  role       = aws_iam_role.codedeploy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda"
}

resource "aws_iam_role_policy" "codedeploy_lambda_permissions" {
  name = "${var.application_name}-codedeploy-lambda-policy"
  role = aws_iam_role.codedeploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaManagement"
        Effect = "Allow"
        Action = [
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:PublishVersion",
          "lambda:UpdateAlias",
          "lambda:GetAlias",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration"
        ]
        Resource = var.lambda_function_arn
      },
      {
        Sid    = "AllowLambdaInvoke"
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "${var.lambda_function_arn}:*"
      }
    ]
  })
}

# -------------------
# CodeDeploy Application
# -------------------
resource "aws_codedeploy_app" "lambda" {
  name             = var.application_name
  compute_platform = "Lambda"

  tags = var.tags
}

# -------------------
# Deployment Configuration
# -------------------
resource "aws_codedeploy_deployment_config" "lambda" {
  count = var.create_custom_deployment_config ? 1 : 0

  deployment_config_name = "${var.application_name}-deployment-config"
  compute_platform       = "Lambda"

  traffic_routing_config {
    type = var.traffic_routing_type

    dynamic "time_based_linear" {
      for_each = var.traffic_routing_type == "TimeBasedLinear" ? [1] : []
      content {
        interval   = var.linear_interval
        percentage = var.linear_percentage
      }
    }

    dynamic "time_based_canary" {
      for_each = var.traffic_routing_type == "TimeBasedCanary" ? [1] : []
      content {
        interval   = var.canary_interval
        percentage = var.canary_percentage
      }
    }
  }
}

resource "aws_codedeploy_deployment_group" "lambda" {
  app_name               = aws_codedeploy_app.lambda.name
  deployment_group_name  = var.deployment_group_name
  service_role_arn       = aws_iam_role.codedeploy.arn
  deployment_config_name = var.create_custom_deployment_config ? aws_codedeploy_deployment_config.lambda[0].id : var.deployment_config_name

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  auto_rollback_configuration {
    enabled = var.enable_auto_rollback
    events  = var.auto_rollback_events
  }

  dynamic "alarm_configuration" {
    for_each = length(var.alarm_names) > 0 ? [1] : []
    content {
      enabled = true
      alarms  = var.alarm_names
    }
  }

  tags = var.tags
}
