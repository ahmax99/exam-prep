#!/bin/bash
set -e

FUNCTION_NAME="${1}"
IMAGE_URI="${2}"
ALIAS_NAME="${3}"
CODEDEPLOY_APP="${4}"
CODEDEPLOY_GROUP="${5}"
AWS_REGION="${6}"
GIT_SHA="${7}"
RELEASE_TAG="${8}"

if [[ -z "$FUNCTION_NAME" ]] || [[ -z "$IMAGE_URI" ]] || [[ -z "$ALIAS_NAME" ]] || [[ -z "$CODEDEPLOY_APP" ]] || [[ -z "$CODEDEPLOY_GROUP" ]] || [[ -z "$AWS_REGION" ]]; then
  echo "❌ Error: Missing required parameters" >&2
  echo "Usage: $0 <function_name> <image_uri> <alias_name> <codedeploy_app> <codedeploy_group> <aws_region> [git_sha] [release_tag]" >&2
  exit 1
fi

echo "🚀 Deploying Lambda function with ECR image"
echo "Function: $FUNCTION_NAME"
echo "Image URI: $IMAGE_URI"
echo "Alias: $ALIAS_NAME"
echo "Region: $AWS_REGION"

echo "Updating Lambda function code with new container image..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --image-uri "$IMAGE_URI" \
  --region "$AWS_REGION" \
  --output json > /tmp/lambda-update.json

echo "Waiting for function update to complete..."
aws lambda wait function-updated \
  --function-name "$FUNCTION_NAME" \
  --region "$AWS_REGION"

echo "Publishing new Lambda version..."
DESCRIPTION="Deployed from GitHub Actions"
[[ -n "$GIT_SHA" ]] && DESCRIPTION="$DESCRIPTION - SHA: $GIT_SHA"
[[ -n "$RELEASE_TAG" ]] && DESCRIPTION="$DESCRIPTION, Tag: $RELEASE_TAG"

VERSION_OUTPUT=$(aws lambda publish-version \
  --function-name "$FUNCTION_NAME" \
  --description "$DESCRIPTION" \
  --region "$AWS_REGION" \
  --output json)

NEW_VERSION=$(echo "$VERSION_OUTPUT" | jq -r '.Version')
echo "✅ Published version: $NEW_VERSION"

echo "Getting current version from alias: $ALIAS_NAME"
if CURRENT_VERSION=$(aws lambda get-alias \
  --function-name "$FUNCTION_NAME" \
  --name "$ALIAS_NAME" \
  --region "$AWS_REGION" \
  --query 'FunctionVersion' \
  --output text 2>/dev/null); then
  echo "Current version from alias: $CURRENT_VERSION"
else
  echo "Alias does not exist yet. This is the first deployment."
  PREVIOUS_VERSION=$(aws lambda list-versions-by-function \
    --function-name "$FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --query 'Versions[-2].Version' \
    --output text 2>/dev/null || echo "1")
  
  if [[ "$PREVIOUS_VERSION" = "None" ]] || [[ "$PREVIOUS_VERSION" = "\$LATEST" ]]; then
    CURRENT_VERSION="1"
  else
    CURRENT_VERSION="$PREVIOUS_VERSION"
  fi
  echo "Using version $CURRENT_VERSION as current version"
fi

echo "Generating AppSpec (JSON format)..."

APPSPEC_JSON=$(cat <<EOF
{
  "version": "0.0",
  "Resources": [{
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Name": "${FUNCTION_NAME}",
        "Alias": "${ALIAS_NAME}",
        "CurrentVersion": "${CURRENT_VERSION}",
        "TargetVersion": "${NEW_VERSION}"
      }
    }
  }]
}
EOF
)

echo "Creating CodeDeploy deployment..."
echo "Application: $CODEDEPLOY_APP"
echo "Deployment Group: $CODEDEPLOY_GROUP"
echo "Current Version: $CURRENT_VERSION"
echo "Target Version: $NEW_VERSION"

DEPLOYMENT_DESCRIPTION="GitHub Actions deployment"
[[ -n "$GIT_SHA" ]] && DEPLOYMENT_DESCRIPTION="$DEPLOYMENT_DESCRIPTION - SHA: $GIT_SHA"
[[ -n "$RELEASE_TAG" ]] && DEPLOYMENT_DESCRIPTION="$DEPLOYMENT_DESCRIPTION, Tag: $RELEASE_TAG"

APPSPEC_CONTENT=$(echo "$APPSPEC_JSON" | jq -c . | jq -Rs .)

DEPLOYMENT_ID=$(aws deploy create-deployment \
  --application-name "$CODEDEPLOY_APP" \
  --deployment-group-name "$CODEDEPLOY_GROUP" \
  --revision revisionType=AppSpecContent,appSpecContent={content="$APPSPEC_CONTENT"} \
  --description "$DEPLOYMENT_DESCRIPTION" \
  --region "$AWS_REGION" \
  --query 'deploymentId' \
  --output text)

echo "✅ Deployment created: $DEPLOYMENT_ID"

echo "Waiting for deployment to complete..."
echo "This may take several minutes due to gradual traffic shifting..."

if ! aws deploy wait deployment-successful \
  --deployment-id "$DEPLOYMENT_ID" \
  --region "$AWS_REGION"; then
  
  echo "❌ Deployment failed. Fetching error details..." >&2
  aws deploy get-deployment \
    --deployment-id "$DEPLOYMENT_ID" \
    --region "$AWS_REGION" \
    --query 'deploymentInfo.errorInformation' \
    --output json
  
  exit 1
fi

echo "✅ Deployment completed successfully!"

if [[ -n "$GITHUB_OUTPUT" ]]; then
  echo "current_version=$CURRENT_VERSION" >> "$GITHUB_OUTPUT"
  echo "new_version=$NEW_VERSION" >> "$GITHUB_OUTPUT"
  echo "deployment_id=$DEPLOYMENT_ID" >> "$GITHUB_OUTPUT"
fi

rm -f /tmp/lambda-update.json
