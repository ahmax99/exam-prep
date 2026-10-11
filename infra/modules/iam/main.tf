resource "aws_iam_role" "vercel_runtime" {
  name                 = var.role_name
  assume_role_policy   = data.aws_iam_policy_document.vercel_runtime_trust.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "vercel_runtime" {
  name   = "${aws_iam_role.vercel_runtime.name}-inline"
  role   = aws_iam_role.vercel_runtime.id
  policy = data.aws_iam_policy_document.vercel_runtime_permissions.json
}
