data "aws_iam_policy_document" "amplify_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com", "amplify.${var.aws_region}.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ssr_compute_permissions" {
  statement {
    sid       = "ReadUploadedObjects"
    actions   = ["s3:GetObject"]
    resources = ["${var.s3_uploads_bucket_arn}/*"]
  }

  statement {
    sid       = "ReadDatabaseSecret"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.database_secret_arn]
  }
}

data "aws_iam_policy_document" "build_service_permissions" {
  statement {
    sid       = "ReadDatabaseSecret"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.database_secret_arn]
  }
}
