data "aws_route53_zone" "main" {
  provider = aws.dns

  name         = var.root_domain
  private_zone = false
}

# Account-level Vercel OIDC provider, owned by the org repo.
data "aws_iam_openid_connect_provider" "vercel" {
  url = "https://oidc.vercel.com/${var.vercel_team}"
}
