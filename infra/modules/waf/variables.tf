variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
