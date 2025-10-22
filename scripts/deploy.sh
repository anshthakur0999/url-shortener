#!/bin/bash
set -e

# Blue-Green Deployment Script
# This script handles pulling the latest Docker image and starting the Blue container

echo "🚀 Starting Blue-Green Deployment..."

# Configuration
ECR_REPO_URI="${ECR_REPO_URI}"
APP_NAME="url-shortener"
BLUE_PORT=3001
GREEN_PORT=3002
BLUE_CONTAINER="${APP_NAME}-blue"
GREEN_CONTAINER="${APP_NAME}-green"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "ECR Repository: $ECR_REPO_URI"
echo "Blue Port: $BLUE_PORT"
echo "Green Port: $GREEN_PORT"

# Step 1: Stop the current Blue container (it becomes backup)
echo -e "${YELLOW}🛑 Stopping current Blue container...${NC}"
if docker ps | grep -q "$BLUE_CONTAINER"; then
  echo "  Stopping $BLUE_CONTAINER..."
  docker stop "$BLUE_CONTAINER" || true
  docker rename "$BLUE_CONTAINER" "${BLUE_CONTAINER}-backup" 2>/dev/null || true
else
  echo "  No Blue container running (first deployment)"
fi

# Step 2: Login to ECR
echo -e "${YELLOW}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "$ECR_REPO_URI" || {
  echo -e "${RED}❌ ECR login failed${NC}"
  exit 1
}

# Step 3: Pull latest image from ECR
echo -e "${YELLOW}📦 Pulling latest image from ECR...${NC}"
IMAGE="${ECR_REPO_URI}:latest"
docker pull "$IMAGE" || {
  echo -e "${RED}❌ Image pull failed${NC}"
  exit 1
}

# Step 4: Start Blue container
echo -e "${YELLOW}🔵 Starting Blue container on port $BLUE_PORT...${NC}"
docker run -d \
  --name "$BLUE_CONTAINER" \
  --restart=unless-stopped \
  -p "$BLUE_PORT:3000" \
  -e "DATABASE_URL=${DATABASE_URL}" \
  -e "KV_REST_API_URL=${KV_REST_API_URL}" \
  -e "KV_REST_API_TOKEN=${KV_REST_API_TOKEN}" \
  -e "NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}" \
  "$IMAGE" || {
  echo -e "${RED}❌ Failed to start Blue container${NC}"
  exit 1
}

echo -e "${YELLOW}⏳ Waiting for Blue container to be ready...${NC}"
sleep 5

# Step 5: Validate Blue container is healthy
echo -e "${YELLOW}🏥 Checking Blue container health...${NC}"
for i in {1..30}; do
  if curl -sf "http://localhost:$BLUE_PORT/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Blue container is healthy!${NC}"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Blue container failed health check after 30 attempts${NC}"
    docker logs "$BLUE_CONTAINER"
    exit 1
  fi
  
  echo "  Attempt $i/30..."
  sleep 1
done

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "Blue container is running on port $BLUE_PORT"
