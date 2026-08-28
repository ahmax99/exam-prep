locals {
  backend_origin_domain  = trimsuffix(replace(var.backend_function_url, "https://", ""), "/")
  frontend_origin_domain = trimsuffix(replace(var.frontend_function_url, "https://", ""), "/")
}
