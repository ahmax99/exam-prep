provider "aws" {
  region = var.aws_region

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

# Reads VERCEL_API_TOKEN from the environment, keeping the token out of the variable graph.
provider "vercel" {
  team = var.vercel_team
}
