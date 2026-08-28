# -------------------
# Cognito User Pool
# -------------------
resource "aws_cognito_user_pool" "this" {
  name = var.user_pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = var.password_policy.minimum_length
    require_lowercase                = var.password_policy.require_lowercase
    require_uppercase                = var.password_policy.require_uppercase
    require_numbers                  = var.password_policy.require_numbers
    require_symbols                  = var.password_policy.require_symbols
    temporary_password_validity_days = var.password_policy.temporary_password_validity_days
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  mfa_configuration = var.mfa_configuration

  dynamic "software_token_mfa_configuration" {
    for_each = var.mfa_configuration != "OFF" ? [1] : []
    content {
      enabled = true
    }
  }

  email_configuration {
    email_sending_account = var.email_configuration.email_sending_account
    source_arn            = var.email_configuration.source_arn
    from_email_address    = var.email_configuration.from_email_address
  }

  user_pool_add_ons {
    advanced_security_mode = var.advanced_security_mode
  }

  deletion_protection = var.deletion_protection

  tags = var.tags
}

# -------------------
# Cognito User Pool Domain
# -------------------
resource "aws_cognito_user_pool_domain" "this" {
  domain                = var.user_pool_domain
  user_pool_id          = aws_cognito_user_pool.this.id
  managed_login_version = 2
}

# -------------------
# Google Identity Provider
# -------------------
resource "aws_cognito_identity_provider" "google" {
  count = var.enable_google_oauth ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.this.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes              = "profile email openid"
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
    token_request_method          = "POST"
    oidc_issuer                   = "https://accounts.google.com"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

# -------------------
# Cognito User Pool Client (Web)
# -------------------
resource "aws_cognito_user_pool_client" "web_app" {
  name         = var.app_client_name
  user_pool_id = aws_cognito_user_pool.this.id

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  supported_identity_providers = concat(
    ["COGNITO"],
    var.enable_google_oauth ? ["Google"] : []
  )

  explicit_auth_flows = [
    "ALLOW_USER_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  id_token_validity      = var.token_validity.id_token_validity
  access_token_validity  = var.token_validity.access_token_validity
  refresh_token_validity = var.token_validity.refresh_token_validity
  token_validity_units {
    id_token      = var.token_validity.id_token_unit
    access_token  = var.token_validity.access_token_unit
    refresh_token = var.token_validity.refresh_token_unit
  }

  read_attributes  = ["email", "email_verified", "name"]
  write_attributes = ["email", "name"]

  generate_secret               = var.generate_client_secret
  enable_token_revocation       = true
  prevent_user_existence_errors = "ENABLED"

  depends_on = [aws_cognito_identity_provider.google]
}

# -------------------
# Managed Login branding
# -------------------
resource "aws_cognito_managed_login_branding" "web_app" {
  user_pool_id = aws_cognito_user_pool.this.id
  client_id    = aws_cognito_user_pool_client.web_app.id

  use_cognito_provided_values = true
}

# -------------------
# Cognito User Groups
# -------------------
resource "aws_cognito_user_group" "users" {
  name         = "Users"
  user_pool_id = aws_cognito_user_pool.this.id
  description  = "Standard users with basic access"
  precedence   = 10
}

resource "aws_cognito_user_group" "admins" {
  name         = "Admins"
  user_pool_id = aws_cognito_user_pool.this.id
  description  = "Administrators with full access"
  precedence   = 1
}

