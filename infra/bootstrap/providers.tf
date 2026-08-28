provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "boilerplate-template"
      ManagedBy = "terraform"
    }
  }
}
