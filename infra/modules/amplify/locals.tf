locals {
  project_name = regex("^(.+)\\.${replace(var.root_domain, ".", "\\.")}$", var.domain_name)[0]

  cert_verification_parts = split(
    " ",
    aws_amplify_domain_association.this.certificate_verification_dns_record
  )

  subdomain_dns_record = [
    for sd in aws_amplify_domain_association.this.sub_domain :
    sd.dns_record if sd.prefix == local.project_name
  ][0]
  subdomain_record_parts = split(" ", local.subdomain_dns_record)

  dns_records = [
    {
      name   = local.cert_verification_parts[0]
      target = element(local.cert_verification_parts, length(local.cert_verification_parts) - 1)
    },
    {
      name   = var.domain_name
      target = element(local.subdomain_record_parts, length(local.subdomain_record_parts) - 1)
    },
  ]
}
