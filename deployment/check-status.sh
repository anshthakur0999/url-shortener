#!/bin/bash
# Script to check the status of Blue-Green deployment

echo "========================================="
echo "Blue-Green Deployment Status"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "${BLUE}=== $1 ===${NC}"; }
print_info() { echo -e "${YELLOW}$1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "kubectl not found. Please install K3s first."
    exit 1
fi

# Get current active environment
ACTIVE_ENV=$(kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "unknown")

print_header "Active Environment"
echo "Currently serving traffic: $ACTIVE_ENV"
echo ""

print_header "Deployments"
kubectl get deployments -n url-shortener
echo ""

print_header "Pods"
kubectl get pods -n url-shortener -l app=url-shortener
echo ""

print_header "Services"
kubectl get svc -n url-shortener
echo ""

print_header "Blue Environment Details"
echo "Pods:"
kubectl get pods -n url-shortener -l version=blue
echo ""
echo "Ready replicas:"
kubectl get deployment url-shortener-blue -n url-shortener -o jsonpath='{.status.readyReplicas}/{.spec.replicas}'
echo ""
echo ""

print_header "Green Environment Details"
echo "Pods:"
kubectl get pods -n url-shortener -l version=green
echo ""
echo "Ready replicas:"
kubectl get deployment url-shortener-green -n url-shortener -o jsonpath='{.status.readyReplicas}/{.spec.replicas}'
echo ""
echo ""

print_header "Recent Events"
kubectl get events -n url-shortener --sort-by='.lastTimestamp' | tail -10
echo ""

print_header "Application Access"
SERVICE_TYPE=$(kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.type}')

if [ "$SERVICE_TYPE" = "NodePort" ]; then
    NODE_PORT=$(kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.ports[0].nodePort}')
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
    echo "Service Type: NodePort"
    echo "Access URL: http://${PUBLIC_IP}:${NODE_PORT}"
elif [ "$SERVICE_TYPE" = "LoadBalancer" ]; then
    EXTERNAL_IP=$(kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    echo "Service Type: LoadBalancer"
    echo "Access URL: http://${EXTERNAL_IP}"
else
    echo "Service Type: $SERVICE_TYPE"
fi
echo ""

print_header "Quick Commands"
echo "Switch to Blue:   kubectl patch svc url-shortener-service -n url-shortener -p '{\"spec\":{\"selector\":{\"version\":\"blue\"}}}'"
echo "Switch to Green:  kubectl patch svc url-shortener-service -n url-shortener -p '{\"spec\":{\"selector\":{\"version\":\"green\"}}}'"
echo "View logs (Blue): kubectl logs -n url-shortener -l version=blue --tail=50"
echo "View logs (Green): kubectl logs -n url-shortener -l version=green --tail=50"
echo ""

