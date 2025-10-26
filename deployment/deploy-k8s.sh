#!/bin/bash
# Script to deploy URL Shortener to Kubernetes
# Run this after setting up EC2 and before configuring Jenkins

set -e

echo "========================================="
echo "URL Shortener - Kubernetes Deployment"
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

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install K3s first."
    exit 1
fi

# Get credentials from user
print_info "Please provide your credentials:"
echo ""

read -p "Neon Database URL: " DATABASE_URL
read -p "Upstash Redis URL: " KV_REST_API_URL
read -p "Upstash Redis Token: " KV_REST_API_TOKEN

echo ""
print_info "Creating Kubernetes resources..."
echo ""

# Step 1: Create namespace
print_info "Creating namespace..."
kubectl apply -f k8s/namespace.yaml
print_success "Namespace created"

# Step 2: Create secrets
print_info "Creating secrets..."
kubectl create secret generic url-shortener-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=KV_REST_API_URL="$KV_REST_API_URL" \
  --from-literal=KV_REST_API_TOKEN="$KV_REST_API_TOKEN" \
  -n url-shortener \
  --dry-run=client -o yaml | kubectl apply -f -
print_success "Secrets created"

# Step 3: Create ConfigMap
print_info "Creating ConfigMap..."
kubectl apply -f k8s/configmap.yaml
print_success "ConfigMap created"

# Step 4: Build and push Docker image
print_info "Building Docker image..."
docker build -t localhost:5000/url-shortener:latest .
print_success "Docker image built"

print_info "Pushing to local registry..."
docker push localhost:5000/url-shortener:latest
print_success "Image pushed to registry"

# Step 5: Deploy Blue and Green environments
print_info "Deploying Blue environment..."
kubectl apply -f k8s/deployment-blue.yaml
print_success "Blue deployment created"

print_info "Deploying Green environment..."
kubectl apply -f k8s/deployment-green.yaml
print_success "Green deployment created"

# Step 6: Create services
print_info "Creating services..."
kubectl apply -f k8s/service.yaml
print_success "Services created"

# Step 7: Create ingress
print_info "Creating ingress..."
kubectl apply -f k8s/ingress.yaml
print_success "Ingress created"

# Wait for deployments to be ready
print_info "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s \
  deployment/url-shortener-blue -n url-shortener || true
kubectl wait --for=condition=available --timeout=300s \
  deployment/url-shortener-green -n url-shortener || true

echo ""
print_success "Deployment complete!"
echo ""

# Show status
print_info "Current status:"
echo ""
kubectl get all -n url-shortener

echo ""
print_info "Service details:"
kubectl get svc url-shortener-service -n url-shortener

echo ""
print_info "To access the application:"
echo "1. Get the service external IP/port:"
echo "   kubectl get svc url-shortener-service -n url-shortener"
echo ""
echo "2. For K3s with NodePort, access via:"
echo "   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):<NodePort>"
echo ""
echo "3. To get NodePort:"
echo "   kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.ports[0].nodePort}'"
echo ""

# Get NodePort if service type is NodePort
SERVICE_TYPE=$(kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.type}')
if [ "$SERVICE_TYPE" = "NodePort" ]; then
    NODE_PORT=$(kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.ports[0].nodePort}')
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    echo ""
    print_success "Application URL: http://${PUBLIC_IP}:${NODE_PORT}"
fi

echo ""
print_info "Next steps:"
echo "1. Configure Jenkins pipeline (see SETUP.md)"
echo "2. Test the application"
echo "3. Set up GitHub webhooks for automatic deployments"
echo ""

