resource "vercel_project" "this" {
  name           = var.project_name
  framework      = "nextjs"
  root_directory = var.root_directory

  # No git_repository: deploy.yml migrates the database, then deploys with the Vercel CLI,
  # so a push must never start a Vercel build of its own.

  oidc_token_config = {
    issuer_mode = "team"
  }

  resource_config = {
    function_default_regions = [var.function_region]
  }
}

resource "vercel_project_environment_variable" "config" {
  for_each = var.environment_variables

  project_id = vercel_project.this.id
  key        = each.key
  value      = each.value
  target     = ["production"]
  sensitive  = false
}

resource "vercel_project_environment_variable" "database_url" {
  project_id = vercel_project.this.id
  key        = "DATABASE_URL"
  # Write-only, so the connection string never lands in state; bump the version to push a new value.
  value_wo         = var.database_url
  value_wo_version = 1
  target           = ["production"]
  sensitive        = true
}

resource "vercel_project_domain" "this" {
  project_id = vercel_project.this.id
  domain     = var.domain_name
}
