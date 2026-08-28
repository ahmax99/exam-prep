resource "aws_cloudwatch_metric_alarm" "this" {
  for_each = local.alarms

  alarm_name          = "${var.name_prefix}-${each.key}"
  alarm_description   = "Lambda ${each.value.metric_name} on ${each.value.function_name}:${each.value.alias_name}; gates CodeDeploy canary rollback."
  namespace           = "AWS/Lambda"
  metric_name         = each.value.metric_name
  statistic           = "Sum"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  period              = 60
  evaluation_periods  = 1

  treat_missing_data = "notBreaching"

  dimensions = {
    FunctionName = each.value.function_name
    Resource     = "${each.value.function_name}:${each.value.alias_name}"
  }

  tags = var.tags
}
