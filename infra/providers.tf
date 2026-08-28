provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "waf"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

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
