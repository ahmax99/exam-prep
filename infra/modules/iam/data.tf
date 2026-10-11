data "aws_iam_policy_document" "vercel_runtime_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.vercel_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.vercel_oidc_issuer}:aud"
      values   = [local.vercel_oidc_audience]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.vercel_oidc_issuer}:sub"
      values   = [local.vercel_oidc_subject]
    }
  }
}

data "aws_iam_policy_document" "vercel_runtime_permissions" {
  statement {
    sid       = "ReadUploadedObjects"
    actions   = ["s3:GetObject"]
    resources = ["${var.s3_uploads_bucket_arn}/*"]
  }
}
