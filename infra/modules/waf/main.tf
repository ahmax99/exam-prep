# -------------------
# WAF Web ACL — CloudFront scope
# -------------------
resource "aws_wafv2_web_acl" "this" {
  name        = "${var.name_prefix}-waf"
  description = "WAF for CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # -------------------
  # Rule 1: Global rate limit — blocks IPs sending > 2000 req / 5 min
  # -------------------
  rule {
    name     = "rate-limit-global"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit-global"
      sampled_requests_enabled   = true
    }
  }

  # -------------------
  # Rule 2: Auth endpoint rate limit — blocks IPs sending > 100 req / 5 min on /auth/*
  # -------------------
  rule {
    name     = "rate-limit-auth"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 100
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string         = "/auth/"
            positional_constraint = "STARTS_WITH"

            field_to_match {
              uri_path {}
            }

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit-auth"
      sampled_requests_enabled   = true
    }
  }

  # -------------------
  # Rule 10: AWS Common Rule Set — OWASP Top 10 (XSS, SQLi, LFI, RFI, etc.)
  # -------------------
  rule {
    name     = "aws-managed-common"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-aws-managed-common"
      sampled_requests_enabled   = true
    }
  }

  # -------------------
  # Rule 20: SQL Injection — deep SQLi detection beyond CommonRuleSet
  # -------------------
  rule {
    name     = "aws-managed-sqli"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-aws-managed-sqli"
      sampled_requests_enabled   = true
    }
  }

  # -------------------
  # Rule 30: Known Bad Inputs — Log4Shell, Spring4Shell, SSRF patterns
  # -------------------
  rule {
    name     = "aws-managed-known-bad-inputs"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-aws-managed-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # -------------------
  # Rule 40: Amazon IP Reputation List — known malicious IPs (botnets, scanners)
  # -------------------
  rule {
    name     = "aws-managed-ip-reputation"
    priority = 40

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-aws-managed-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

# -------------------
# WAF Logging — logs blocked requests to CloudWatch
# -------------------
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${var.name_prefix}"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_wafv2_web_acl_logging_configuration" "this" {
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
  resource_arn            = aws_wafv2_web_acl.this.arn

  logging_filter {
    default_behavior = "DROP"

    filter {
      behavior    = "KEEP"
      requirement = "MEETS_ANY"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }
    }
  }
}
