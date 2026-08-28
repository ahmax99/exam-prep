locals {
  # Render the JS template with the allowed hosts list injected as a JSON array
  function_source = templatefile("${path.module}/function/index.js.tftpl", {
    allowed_hosts_json = jsonencode(var.allowed_hosts)
  })
  function_zip_path = "${path.module}/function/index.zip"

  # Render the origin-request SigV4 signer template with its signing region injected
  signer_function_source = templatefile("${path.module}/function/sign-origin-request.js.tftpl", {
    signer_region = var.signer_region
  })
  signer_function_zip_path = "${path.module}/function/sign-origin-request.zip"
}
