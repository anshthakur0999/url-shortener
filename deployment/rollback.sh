#!/bin/bash
# Quick rollback script for Blue-Green deployment

set -e

echo "========================================="
echo "Blue-Green Deployment Rollback"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Get current active environment
CURRENT_ENV=$(kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.selector.version}')

if [ -z "$CURRENT_ENV" ]; then
    print_error "Could not detect current environment"
    exit 1
fi

# Determine target environment
if [ "$CURRENT_ENV" = "blue" ]; then
    TARGET_ENV="green"
else
    TARGET_ENV="blue"
fi

print_info "Current active environment: $CURRENT_ENV"
print_info "Will rollback to: $TARGET_ENV"
echo ""

# Confirm rollback
read -p "Are you sure you want to rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Rollback cancelled"
    exit 0
fi

echo ""
print_info "Performing rollback..."

# Switch service selector
kubectl patch service url-shortener-service \
    -n url-shortener \
    -p "{\"spec\":{\"selector\":{\"version\":\"$TARGET_ENV\"}}}"

print_success "Rollback complete!"
echo ""

print_info "Traffic is now routed to: $TARGET_ENV"
print_info "Previous environment ($CURRENT_ENV) is still running"
echo ""

# Show current status
print_info "Current pods:"
kubectl get pods -n url-shortener -l app=url-shortener

echo ""
print_info "Service status:"
kubectl get svc url-shortener-service -n url-shortener

echo ""
print_success "Rollback successful!"
print_info "Monitor the application to ensure it's working correctly"
echo ""

