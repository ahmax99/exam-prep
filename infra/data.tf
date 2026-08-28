data "aws_route53_zone" "main" {
  provider = aws.dns

  name         = var.root_domain
  private_zone = false
}
