data "archive_file" "function" {
  type        = "zip"
  output_path = local.function_zip_path

  source {
    content  = local.function_source
    filename = "index.js"
  }
}

data "archive_file" "signer" {
  type        = "zip"
  output_path = local.signer_function_zip_path

  source {
    content  = local.signer_function_source
    filename = "index.js"
  }
}
