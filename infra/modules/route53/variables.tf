variable "zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
}

variable "cname_records" {
  description = "CNAME records to create in the zone, keyed by a stable logical name so retargeting one is an in-place update"
  type = map(object({
    name   = string
    target = string
  }))
}
