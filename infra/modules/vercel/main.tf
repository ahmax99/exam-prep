resource "vercel_project" "this" {
  name           = var.project_name
  framework      = "nextjs"
  root_directory = var.root_directory

  git_repository = {
    type              = "github"
    repo              = var.git_repository
    production_branch = var.production_branch
  }

  # Production-only: every build runs `prisma migrate deploy`, so a preview would migrate the prod database.
  ignore_command = "[ \"$VERCEL_GIT_COMMIT_REF\" != \"${var.production_branch}\" ]"

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
