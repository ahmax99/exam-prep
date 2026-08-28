resource "aws_iam_role" "this" {
  name                 = var.role_name
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600

  tags = var.tags
}

resource "aws_iam_role_policy" "this" {
  name   = "${var.role_name}-inline"
  role   = aws_iam_role.this.id
  policy = data.aws_iam_policy_document.permissions.json
}
