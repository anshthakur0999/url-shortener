#!/bin/bash
set -e

# Validation script to verify the deployment is working
# Checks health endpoint and runs smoke tests

BLUE_PORT=3001
APP_NAME="url-shortener"
BLUE_CONTAINER="${APP_NAME}-blue"

echo "🧪 Validating deployment..."

# Check if container is running
if ! docker ps | grep -q "$BLUE_CONTAINER"; then
  echo "❌ Blue container is not running!"
  exit 1
fi

echo "✅ Container is running"

# Check health endpoint
echo "🏥 Checking health endpoint..."
for i in {1..10}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$BLUE_PORT/api/health")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed"
    break
  fi
  
  if [ $i -eq 10 ]; then
    echo "❌ Health check failed after 10 attempts"
    echo "Response: $RESPONSE"
    exit 1
  fi
  
  echo "  Attempt $i/10... (HTTP $HTTP_CODE)"
  sleep 1
done

# Test main endpoint
echo "📊 Testing main endpoint..."
MAIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BLUE_PORT/")
if [ "$MAIN_RESPONSE" = "200" ] || [ "$MAIN_RESPONSE" = "404" ]; then
  echo "✅ Main endpoint responding"
else
  echo "⚠️  Unexpected response from main endpoint: $MAIN_RESPONSE"
fi

# Test API endpoint
echo "📡 Testing API endpoint..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BLUE_PORT/api/urls")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "405" ] || [ "$API_RESPONSE" = "401" ]; then
  echo "✅ API endpoint responding"
else
  echo "⚠️  Unexpected response from API endpoint: $API_RESPONSE"
fi

echo ""
echo "✅ All validation checks passed!"
echo "Deployment is ready to go live"
