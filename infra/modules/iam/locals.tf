locals {
  vercel_oidc_issuer   = "oidc.vercel.com/${var.vercel_team}"
  vercel_oidc_audience = "https://vercel.com/${var.vercel_team}"
  # Only production deployments of this one project may assume the role.
  vercel_oidc_subject = "owner:${var.vercel_team}:project:${var.vercel_project_name}:environment:production"
}
