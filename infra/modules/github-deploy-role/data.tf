data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [var.github_subject]
    }
  }
}

data "aws_iam_policy_document" "permissions" {
  statement {
    sid = "LambdaDeploy"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:PublishVersion",
      "lambda:GetAlias",
      "lambda:ListVersionsByFunction",
    ]
    resources = concat(
      var.lambda_function_arns,
      [for arn in var.lambda_function_arns : "${arn}:*"],
    )
  }

  statement {
    sid = "CodeDeploy"
    actions = [
      "codedeploy:CreateDeployment",
      "codedeploy:GetDeployment",
      "codedeploy:RegisterApplicationRevision",
      "codedeploy:GetApplicationRevision",
    ]
    resources = concat(var.codedeploy_application_arns, var.codedeploy_deployment_group_arns)
  }

  statement {
    sid       = "CodeDeployConfig"
    actions   = ["codedeploy:GetDeploymentConfig"]
    resources = ["arn:aws:codedeploy:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:deploymentconfig:*"]
  }

  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPull"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = var.ecr_pull_repository_arns
  }

  statement {
    sid       = "StaticAssetsList"
    actions   = ["s3:ListBucket"]
    resources = [var.static_assets_bucket_arn]
  }

  statement {
    sid       = "StaticAssetsWrite"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["${var.static_assets_bucket_arn}/*"]
  }

  statement {
    sid       = "CloudFrontInvalidate"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [var.cloudfront_distribution_arn]
  }
}
