resource "aws_route53_record" "cname" {
  for_each = var.cname_records

  zone_id = var.zone_id
  name    = each.value.name
  type    = "CNAME"
  ttl     = 300
  records = [each.value.target]
}
