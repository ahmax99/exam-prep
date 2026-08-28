# -------------------
# S3 Bucket
# -------------------
resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name

  tags = var.tags
}

# -------------------
# Ownership controls (required to enable ACL)
# -------------------
resource "aws_s3_bucket_ownership_controls" "this" {
  count  = var.enable_acl ? 1 : 0
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "this" {
  count  = var.enable_acl ? 1 : 0
  bucket = aws_s3_bucket.this.id
  acl    = "log-delivery-write"

  depends_on = [aws_s3_bucket_ownership_controls.this]
}

# -------------------
# Versioning
# -------------------
resource "aws_s3_bucket_versioning" "this" {
  count  = var.enable_versioning ? 1 : 0
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

# -------------------
# Server-side encryption
# -------------------
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  count  = var.enable_encryption ? 1 : 0
  bucket = aws_s3_bucket.this.id

  rule {
    bucket_key_enabled = false // for SSE-S3, bucket key is not needed

    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }

  lifecycle {
    # AWS auto-applies SSE-S3 as the bucket default and mutates this rule out-of-band, causing perpetual drift.
    ignore_changes = [rule]
  }
}

# -------------------
# Public access block
# -------------------
resource "aws_s3_bucket_public_access_block" "this" {
  count  = var.block_public_access ? 1 : 0
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -------------------
# CORS configuration
# -------------------
resource "aws_s3_bucket_cors_configuration" "this" {
  count  = var.enable_cors ? 1 : 0
  bucket = aws_s3_bucket.this.id

  cors_rule {
    allowed_headers = var.cors_allowed_headers
    allowed_methods = var.cors_allowed_methods
    allowed_origins = var.cors_allowed_origins
    max_age_seconds = var.cors_max_age_seconds
  }
}

# -------------------
# HTTPS-only bucket policy
# -------------------
resource "aws_s3_bucket_policy" "enforce_https" {
  count  = var.enforce_https ? 1 : 0
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyNonHTTPS"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.this.arn,
          "${aws_s3_bucket.this.arn}/*",
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.this]
}

# -------------------
# Access logging
# -------------------
resource "aws_s3_bucket_logging" "this" {
  count  = var.enable_access_logging ? 1 : 0
  bucket = aws_s3_bucket.this.id

  target_bucket = var.logging_target_bucket
  target_prefix = var.logging_target_prefix
}

# -------------------
# Lifecycle rules
# -------------------
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count  = length(var.lifecycle_rules) > 0 ? 1 : 0
  bucket = aws_s3_bucket.this.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [1] : []
        content {
          days = rule.value.expiration_days
        }
      }

      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration != null ? [1] : []
        content {
          noncurrent_days = rule.value.noncurrent_version_expiration
        }
      }

      dynamic "transition" {
        for_each = rule.value.transition_days != null && rule.value.transition_storage_class != null ? [1] : []
        content {
          days          = rule.value.transition_days
          storage_class = rule.value.transition_storage_class
        }
      }
    }
  }
}
