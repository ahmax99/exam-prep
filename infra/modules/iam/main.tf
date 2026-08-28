resource "aws_iam_role" "ssr_compute" {
  name                 = "${var.tags["Name"]}-ssr-compute"
  assume_role_policy   = data.aws_iam_policy_document.amplify_trust.json
  max_session_duration = 3600

  tags = var.tags
}

resource "aws_iam_role_policy" "ssr_compute" {
  name   = "${aws_iam_role.ssr_compute.name}-inline"
  role   = aws_iam_role.ssr_compute.id
  policy = data.aws_iam_policy_document.ssr_compute_permissions.json
}

resource "aws_iam_role" "build_service" {
  name                 = "${var.tags["Name"]}-build-service"
  assume_role_policy   = data.aws_iam_policy_document.amplify_trust.json
  max_session_duration = 3600

  tags = var.tags
}

resource "aws_iam_role_policy" "build_service" {
  name   = "${aws_iam_role.build_service.name}-inline"
  role   = aws_iam_role.build_service.id
  policy = data.aws_iam_policy_document.build_service_permissions.json
}
