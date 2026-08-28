provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# WAFv2 must be provisioned in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

# Root Route 53 zone lives in a dedicated domain-hosting account.
provider "aws" {
  alias  = "dns"
  region = var.aws_region

  dynamic "assume_role" {
    for_each = var.dns_account_role_arn != "" ? [var.dns_account_role_arn] : []
    content {
      role_arn = assume_role.value
    }
  }

  default_tags {
    tags = local.common_tags
  }
}
