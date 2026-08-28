variable "zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
}

variable "cname_records" {
  description = "CNAME records to create in the zone, e.g. domain-verification and subdomain records"
  type = list(object({
    name   = string
    target = string
  }))
}
