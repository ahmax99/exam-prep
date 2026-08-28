locals {
  alarms = {
    backend-errors = {
      function_name = var.backend_function_name
      alias_name    = var.backend_alias_name
      metric_name   = "Errors"
    }
    backend-throttles = {
      function_name = var.backend_function_name
      alias_name    = var.backend_alias_name
      metric_name   = "Throttles"
    }
    frontend-errors = {
      function_name = var.frontend_function_name
      alias_name    = var.frontend_alias_name
      metric_name   = "Errors"
    }
    frontend-throttles = {
      function_name = var.frontend_function_name
      alias_name    = var.frontend_alias_name
      metric_name   = "Throttles"
    }
  }
}
