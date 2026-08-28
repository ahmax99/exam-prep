output "dns_records" {
  description = "CNAME records (certificate verification + subdomain) to create in the DNS zone"
  value       = local.dns_records
}

output "default_domain" {
  description = "Amplify's own *.amplifyapp.com fallback domain"
  value       = aws_amplify_app.this.default_domain
}

output "app_id" {
  description = "Amplify app ID"
  value       = aws_amplify_app.this.id
}

output "app_arn" {
  description = "Amplify app ARN — used to associate a WAFv2 Web ACL"
  value       = aws_amplify_app.this.arn
}
