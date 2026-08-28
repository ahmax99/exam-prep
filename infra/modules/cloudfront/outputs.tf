output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.this.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.this.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name (use for DNS CNAME)"
  value       = aws_cloudfront_distribution.this.domain_name
}

output "hosted_zone_id" {
  description = "CloudFront hosted zone ID (use for Route 53 alias record)"
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}

output "backend_oac_id" {
  description = "OAC ID for the backend Lambda origin"
  value       = aws_cloudfront_origin_access_control.backend.id
}
