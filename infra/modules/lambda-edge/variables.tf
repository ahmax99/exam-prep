variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
}

variable "allowed_hosts" {
  description = "List of allowed Host header values — requests from any other host are rejected with 403"
  type        = list(string)
}

variable "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution — grants edgelambda.amazonaws.com permission to invoke this function"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}

variable "signer_region" {
  description = "AWS region for the origin-request signer's SigV4 credential scope — must match the frontend Lambda Function URL's region"
  type        = string
}

variable "frontend_function_arn" {
  description = "ARN of the frontend Lambda function — the origin-request signer's SigV4 target"
  type        = string
}

variable "frontend_function_alias" {
  description = "Alias qualifier of the frontend Lambda function"
  type        = string
}
