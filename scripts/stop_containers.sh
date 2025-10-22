#!/bin/bash
set -e

# Script to stop and clean up Docker containers
# Used for cleanup and emergency stopping

APP_NAME="url-shortener"
BLUE_CONTAINER="${APP_NAME}-blue"
GREEN_CONTAINER="${APP_NAME}-green"

echo "🛑 Stopping containers..."

# Stop Blue container
if docker ps -a | grep -q "$BLUE_CONTAINER"; then
  echo "  Stopping $BLUE_CONTAINER..."
  docker stop "$BLUE_CONTAINER" 2>/dev/null || true
  docker remove "$BLUE_CONTAINER" 2>/dev/null || true
fi

# Stop Green container
if docker ps -a | grep -q "$GREEN_CONTAINER"; then
  echo "  Stopping $GREEN_CONTAINER..."
  docker stop "$GREEN_CONTAINER" 2>/dev/null || true
  docker remove "$GREEN_CONTAINER" 2>/dev/null || true
fi

# Clean up backup containers
echo "🧹 Cleaning up backup containers..."
docker ps -a | grep "${APP_NAME}-" | awk '{print $1}' | xargs -r docker remove 2>/dev/null || true

echo "✅ All containers stopped"
