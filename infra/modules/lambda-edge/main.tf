# -------------------
# IAM Role for Lambda@Edge
# -------------------
resource "aws_iam_role" "lambda_edge" {
  name = "${var.name_prefix}-lambda-edge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_edge_basic" {
  role       = aws_iam_role.lambda_edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# -------------------
# Lambda@Edge function
# -------------------
resource "aws_lambda_function" "this" {
  function_name    = "${var.name_prefix}-lambda-edge-restrict-host"
  role             = aws_iam_role.lambda_edge.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.function.output_path
  source_code_hash = data.archive_file.function.output_base64sha256


  timeout     = 5 # viewer-request: max 5 seconds
  memory_size = 128

  publish = true

  tags = var.tags
}

resource "aws_lambda_permission" "cloudfront_invoke" {
  statement_id  = "AllowCloudFrontInvokeLambdaEdge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.arn
  qualifier     = aws_lambda_function.this.version
  principal     = "edgelambda.amazonaws.com"
  source_arn    = var.cloudfront_distribution_arn
}

# -------------------
# Lambda@Edge function — origin-request SigV4 signer
# OAC cannot sign an anonymous browser request body, so this function signs
# write requests to the frontend Function URL in the edge role's place.
# -------------------
resource "aws_lambda_function" "signer" {
  function_name    = "${var.name_prefix}-lambda-edge-sign-origin-request"
  role             = aws_iam_role.lambda_edge.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.signer.output_path
  source_code_hash = data.archive_file.signer.output_base64sha256

  timeout     = 5 # origin-request with include_body: small JSON, no need for the 30s ceiling
  memory_size = 128

  publish = true

  tags = var.tags
}

resource "aws_lambda_permission" "cloudfront_invoke_signer" {
  statement_id  = "AllowCloudFrontInvokeLambdaEdgeSigner"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.signer.arn
  qualifier     = aws_lambda_function.signer.version
  principal     = "edgelambda.amazonaws.com"
  source_arn    = var.cloudfront_distribution_arn
}

# Grants the edge role permission to invoke the Function URL it signs requests for
resource "aws_iam_role_policy" "signer_invoke_frontend" {
  name = "${var.name_prefix}-invoke-frontend-function-url"
  role = aws_iam_role.lambda_edge.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunctionUrl",
          "lambda:InvokeFunction"
        ]
        Resource = [
          var.frontend_function_arn,
          "${var.frontend_function_arn}:${var.frontend_function_alias}"
        ]
      }
    ]
  })
}
