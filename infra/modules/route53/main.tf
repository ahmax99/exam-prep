resource "aws_route53_record" "cname" {
  count = length(var.cname_records)

  zone_id = var.zone_id
  name    = var.cname_records[count.index].name
  type    = "CNAME"
  ttl     = 300
  records = [var.cname_records[count.index].target]
}
