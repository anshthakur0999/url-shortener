# Blue-Green Deployment Setup Guide
## URL Shortener on AWS EC2 with K3s, Jenkins, and Docker

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [AWS EC2 Setup](#aws-ec2-setup)
4. [K3s Installation](#k3s-installation)
5. [Docker Registry Setup](#docker-registry-setup)
6. [Jenkins Installation](#jenkins-installation)
7. [Kubernetes Deployment](#kubernetes-deployment)
8. [Jenkins Pipeline Configuration](#jenkins-pipeline-configuration)
9. [Testing Blue-Green Deployment](#testing-blue-green-deployment)
10. [Cost Optimization](#cost-optimization)
11. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
GitHub Repository
       ↓
Jenkins (on EC2) → Build Docker Image → Push to Local Registry
       ↓
Deploy to K3s Cluster (Blue/Green)
       ↓
Switch Traffic via Service Selector
       ↓
Production Traffic → Active Environment (Blue or Green)
```

**Components:**
- **EC2 Instance**: Single t3.medium instance (~$30/month)
- **K3s**: Lightweight Kubernetes distribution
- **Jenkins**: CI/CD automation
- **Docker**: Container runtime
- **Local Docker Registry**: Image storage
- **Neon PostgreSQL**: Database (external)
- **Upstash Redis**: Cache (external)

---

## ✅ Prerequisites

### Required Accounts
- [ ] AWS Account with billing enabled
- [ ] Neon PostgreSQL database (free tier available)
- [ ] Upstash Redis database (free tier available)
- [ ] GitHub account (for code repository)
- [ ] Domain name (optional, for production)

### Local Requirements
- SSH client
- Git
- Basic Linux/terminal knowledge

---

## 🚀 AWS EC2 Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console** → EC2 Dashboard

2. **Launch Instance** with these settings:
   - **Name**: `url-shortener-k3s-jenkins`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: `t3.medium` (2 vCPU, 4GB RAM)
   - **Key Pair**: Create new or use existing
   - **Network Settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
     - Allow Custom TCP (port 8080) from your IP (Jenkins)
   - **Storage**: 30 GB gp3 SSD

3. **Launch Instance** and wait for it to start

4. **Note down**:
   - Public IP address
   - Private key file location

### Step 2: Connect to EC2

```bash
# Set correct permissions for key
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 3: Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim
```

---

## ⚙️ K3s Installation

### Install K3s

```bash
# Install K3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Wait for K3s to be ready
sudo systemctl status k3s

# Set up kubectl access for ubuntu user
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown ubuntu:ubuntu ~/.kube/config
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown ubuntu:ubuntu ~/.kube/config

# Verify installation
kubectl get nodes
# Should show: Ready
```

### Configure K3s

```bash
# Add kubectl alias (optional)
echo "alias k='kubectl'" >> ~/.bashrc
source ~/.bashrc

# Verify cluster is working
kubectl cluster-info
kubectl get all --all-namespaces
```

---

## 🐳 Docker Registry Setup

### Option 1: Local Docker Registry (Recommended for Testing)

```bash
# Install Docker (if not already installed with K3s)
sudo apt install -y docker.io
sudo usermod -aG docker ubuntu
newgrp docker

# Start local Docker registry
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Verify registry is running
curl http://localhost:5000/v2/_catalog
```

### Option 2: Docker Hub (Alternative)

```bash
# Login to Docker Hub
docker login

# Update Jenkinsfile:
# Change DOCKER_REGISTRY to your Docker Hub username
# Example: DOCKER_REGISTRY = 'yourusername'
```

---

## 🔧 Jenkins Installation

### Install Jenkins

```bash
# Install Java (required for Jenkins)
sudo apt install -y openjdk-11-jdk

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Configure Jenkins

1. **Access Jenkins**: Open browser to `http://<EC2-PUBLIC-IP>:8080`

2. **Unlock Jenkins**: Paste the initial admin password

3. **Install Suggested Plugins**

4. **Create Admin User**

5. **Install Additional Plugins**:
   - Go to: Manage Jenkins → Manage Plugins → Available
   - Install:
     - Docker Pipeline
     - Kubernetes CLI
     - Git
     - Pipeline

### Configure Jenkins for Kubernetes

```bash
# Give Jenkins access to kubectl
sudo usermod -aG docker jenkins
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

# Restart Jenkins
sudo systemctl restart jenkins
```

---

## ☸️ Kubernetes Deployment

### Step 1: Clone Your Repository on EC2

```bash
cd ~
git clone <your-github-repo-url>
cd url-shortener
```

### Step 2: Create Kubernetes Secrets

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets with your actual credentials
kubectl create secret generic url-shortener-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host/db?sslmode=require' \
  --from-literal=KV_REST_API_URL='https://your-redis.upstash.io' \
  --from-literal=KV_REST_API_TOKEN='your-token' \
  -n url-shortener

# Verify secret
kubectl get secrets -n url-shortener
```

### Step 3: Deploy Kubernetes Resources

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment-blue.yaml
kubectl apply -f k8s/deployment-green.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployments
kubectl get all -n url-shortener
```

### Step 4: Build and Push Initial Image

```bash
# Build Docker image
docker build -t localhost:5000/url-shortener:latest .

# Push to local registry
docker push localhost:5000/url-shortener:latest

# Update deployments to use the image
kubectl set image deployment/url-shortener-blue \
  url-shortener=localhost:5000/url-shortener:latest \
  -n url-shortener

kubectl set image deployment/url-shortener-green \
  url-shortener=localhost:5000/url-shortener:latest \
  -n url-shortener
```

---

## 🔄 Jenkins Pipeline Configuration

### Step 1: Create Jenkins Pipeline Job

1. **Jenkins Dashboard** → New Item
2. **Name**: `url-shortener-blue-green`
3. **Type**: Pipeline
4. Click **OK**

### Step 2: Configure Pipeline

1. **General** section:
   - ✅ GitHub project: `<your-repo-url>`

2. **Build Triggers**:
   - ✅ Poll SCM: `H/5 * * * *` (check every 5 minutes)
   - Or use GitHub webhooks for instant builds

3. **Pipeline** section:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `<your-repo-url>`
   - **Branch**: `*/main` (or your branch)
   - **Script Path**: `Jenkinsfile`

4. **Save**

### Step 3: Update Jenkinsfile (if needed)

Edit `Jenkinsfile` in your repository:

```groovy
environment {
    DOCKER_REGISTRY = 'localhost:5000'  // Keep this for local registry
    // OR use Docker Hub:
    // DOCKER_REGISTRY = 'yourdockerhubusername'
}
```

---

## 🧪 Testing Blue-Green Deployment

### Manual Test

```bash
# Check current active environment
kubectl get service url-shortener-service -n url-shortener -o yaml | grep version

# Get service external IP
kubectl get service url-shortener-service -n url-shortener

# Test the application
curl http://<EXTERNAL-IP>/api/urls
```

### Trigger Jenkins Build

1. Go to Jenkins → `url-shortener-blue-green` job
2. Click **Build Now**
3. Watch the build progress in **Console Output**

### Verify Blue-Green Switch

```bash
# Before deployment - check active version
kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.selector.version}'

# After deployment - should switch to other version
kubectl get svc url-shortener-service -n url-shortener -o jsonpath='{.spec.selector.version}'

# Check both deployments are running
kubectl get deployments -n url-shortener
```

### Manual Rollback (if needed)

```bash
# Switch back to previous environment
kubectl patch service url-shortener-service \
  -n url-shortener \
  -p '{"spec":{"selector":{"version":"blue"}}}'  # or "green"
```

---

## 💰 Cost Optimization

### Monthly Cost Breakdown

| Resource | Cost |
|----------|------|
| EC2 t3.medium | ~$30 |
| EBS Storage (30GB) | ~$3 |
| Data Transfer | ~$1-5 |
| **Total** | **~$35/month** |

### Cost-Saving Tips

1. **Use Spot Instances** (70% cheaper, but can be terminated)
```bash
# When launching EC2, select "Spot Instance"
```

2. **Stop Instance When Not in Use**
```bash
# Stop instance (keeps data, stops billing for compute)
aws ec2 stop-instances --instance-ids <instance-id>

# Start when needed
aws ec2 start-instances --instance-ids <instance-id>
```

3. **Use AWS Free Tier**
   - First 12 months: 750 hours/month of t2.micro (free)
   - Downgrade to t3.small if t3.medium is too expensive

4. **Set Up Billing Alerts**
   - AWS Console → Billing → Budgets
   - Create alert for $50/month

5. **Clean Up Unused Resources**
```bash
# Remove old Docker images
docker system prune -a

# Remove unused Kubernetes resources
kubectl delete pods --field-selector status.phase=Failed -n url-shortener
```

---

## 🐛 Troubleshooting

### Issue: Pods not starting

```bash
# Check pod status
kubectl get pods -n url-shortener

# Check pod logs
kubectl logs <pod-name> -n url-shortener

# Describe pod for events
kubectl describe pod <pod-name> -n url-shortener
```

### Issue: Image pull errors

```bash
# Check if image exists in registry
curl http://localhost:5000/v2/url-shortener/tags/list

# Rebuild and push image
docker build -t localhost:5000/url-shortener:latest .
docker push localhost:5000/url-shortener:latest
```

### Issue: Jenkins can't access kubectl

```bash
# Fix permissions
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

### Issue: Service not accessible

```bash
# Check service
kubectl get svc -n url-shortener

# Check if LoadBalancer has external IP
# For K3s, you might need to use NodePort instead
kubectl patch svc url-shortener-service -n url-shortener \
  -p '{"spec":{"type":"NodePort"}}'

# Access via: http://<EC2-IP>:<NodePort>
```

---

## 📚 Next Steps

1. **Set up domain name** and point to EC2 IP
2. **Configure SSL/TLS** with Let's Encrypt
3. **Set up monitoring** with Prometheus/Grafana
4. **Configure GitHub webhooks** for automatic builds
5. **Add automated tests** to pipeline
6. **Set up backup strategy** for data

---

## 🎓 Learning Resources

- [K3s Documentation](https://docs.k3s.io/)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Kubernetes Blue-Green Deployment](https://kubernetes.io/blog/2018/04/30/zero-downtime-deployment-kubernetes-jenkins/)

---

**Need Help?** Check the troubleshooting section or review Jenkins console logs!

