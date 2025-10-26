#!/bin/bash
# Automated setup script for EC2 instance
# Run this script on your fresh Ubuntu EC2 instance

set -e  # Exit on error

echo "========================================="
echo "URL Shortener - EC2 Setup Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user."
    exit 1
fi

print_info "Starting setup process..."
echo ""

# Step 1: Update system
print_info "Step 1/7: Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop
print_success "System updated"
echo ""

# Step 2: Install Docker
print_info "Step 2/7: Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt install -y docker.io
    sudo usermod -aG docker ubuntu
    sudo systemctl enable docker
    sudo systemctl start docker
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi
echo ""

# Step 3: Install K3s
print_info "Step 3/7: Installing K3s..."
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | sh -
    
    # Wait for K3s to be ready
    sleep 10
    
    # Set up kubectl config
    mkdir -p ~/.kube
    sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
    sudo chown ubuntu:ubuntu ~/.kube/config
    
    print_success "K3s installed"
else
    print_success "K3s already installed"
fi
echo ""

# Step 4: Install Java (for Jenkins)
print_info "Step 4/7: Installing Java..."
if ! command -v java &> /dev/null; then
    sudo apt install -y openjdk-11-jdk
    print_success "Java installed"
else
    print_success "Java already installed"
fi
echo ""

# Step 5: Install Jenkins
print_info "Step 5/7: Installing Jenkins..."
if ! command -v jenkins &> /dev/null; then
    curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
        /usr/share/keyrings/jenkins-keyring.asc > /dev/null
    
    echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
        https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
        /etc/apt/sources.list.d/jenkins.list > /dev/null
    
    sudo apt update
    sudo apt install -y jenkins
    
    # Start Jenkins
    sudo systemctl enable jenkins
    sudo systemctl start jenkins
    
    # Configure Jenkins for Docker and Kubernetes
    sudo usermod -aG docker jenkins
    sudo mkdir -p /var/lib/jenkins/.kube
    sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
    sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
    
    print_success "Jenkins installed"
    
    # Wait for Jenkins to start
    sleep 15
    
    print_info "Jenkins initial admin password:"
    sudo cat /var/lib/jenkins/secrets/initialAdminPassword
else
    print_success "Jenkins already installed"
fi
echo ""

# Step 6: Set up local Docker registry
print_info "Step 6/7: Setting up local Docker registry..."
if ! docker ps | grep -q registry; then
    # Need to use sudo for docker commands until we re-login
    sudo docker run -d -p 5000:5000 --restart=always --name registry registry:2
    print_success "Docker registry started"
else
    print_success "Docker registry already running"
fi
echo ""

# Step 7: Verify installations
print_info "Step 7/7: Verifying installations..."
echo ""

# Check K3s
if kubectl get nodes &> /dev/null; then
    print_success "K3s is running"
    kubectl get nodes
else
    print_error "K3s is not running properly"
fi
echo ""

# Check Docker
if sudo docker ps &> /dev/null; then
    print_success "Docker is running"
else
    print_error "Docker is not running properly"
fi
echo ""

# Check Jenkins
if sudo systemctl is-active --quiet jenkins; then
    print_success "Jenkins is running"
    echo "Access Jenkins at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
else
    print_error "Jenkins is not running properly"
fi
echo ""

# Check Docker registry
if curl -s http://localhost:5000/v2/_catalog &> /dev/null; then
    print_success "Docker registry is running"
else
    print_error "Docker registry is not running properly"
fi
echo ""

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
print_info "Next Steps:"
echo "1. Access Jenkins at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
echo "2. Use the password shown above to unlock Jenkins"
echo "3. Install suggested plugins"
echo "4. Create admin user"
echo "5. Clone your repository: git clone <your-repo-url>"
echo "6. Follow the SETUP.md guide for Kubernetes deployment"
echo ""
print_info "IMPORTANT: You need to log out and log back in for Docker group changes to take effect!"
echo "Run: exit"
echo "Then reconnect via SSH"
echo ""

