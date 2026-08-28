variable "resource_arn" {
  description = "ARN of the resource to protect (the Amplify app)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources — must include a \"Name\" key, used as the Web ACL's name"
  type        = map(string)

  validation {
    condition     = contains(keys(var.tags), "Name")
    error_message = "tags must include a \"Name\" key — it's used as the Web ACL's name."
  }
}
