data "aws_route53_zone" "main" {
  count    = var.environment == "prod" ? 1 : 0
  provider = aws.dns

  name         = var.root_domain
  private_zone = false
}

data "aws_route53_zone" "env" {
  count = var.environment == "prod" ? 0 : 1

  name         = "${var.environment}.${var.root_domain}"
  private_zone = false
}
