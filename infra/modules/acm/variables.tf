variable "domain_name" {
  description = "Domain name for the certificate"
  type        = string
}

variable "zone_id" {
  description = "Route 53 hosted zone ID for DNS validation"
  type        = string
}

variable "subject_alternative_names" {
  description = "Additional domain names to include in the certificate"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
