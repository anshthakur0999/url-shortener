# 🎉 Blue-Green Deployment - Complete Setup

## ✅ What Has Been Created

All files for automated Blue-Green deployment on AWS have been created successfully!

---

## 📦 Files Created

### Docker Configuration
- ✅ `Dockerfile` - Multi-stage optimized build for Next.js
- ✅ `.dockerignore` - Excludes unnecessary files from Docker build

### Kubernetes Manifests (`k8s/` folder)
- ✅ `namespace.yaml` - Kubernetes namespace for isolation
- ✅ `configmap.yaml` - Environment configuration
- ✅ `secret.yaml.example` - Template for secrets (you'll create actual secret.yaml)
- ✅ `deployment-blue.yaml` - Blue environment deployment
- ✅ `deployment-green.yaml` - Green environment deployment
- ✅ `service.yaml` - Services for traffic routing
- ✅ `ingress.yaml` - Ingress configuration for external access

### CI/CD Pipeline
- ✅ `Jenkinsfile` - Complete automated deployment pipeline

### Deployment Scripts (`deployment/` folder)
- ✅ `setup-ec2.sh` - Automated EC2 instance setup
- ✅ `deploy-k8s.sh` - Kubernetes deployment automation
- ✅ `rollback.sh` - Quick rollback script
- ✅ `check-status.sh` - Status monitoring script

### Documentation (`deployment/` folder)
- ✅ `README.md` - Overview and quick reference
- ✅ `QUICKSTART.md` - Fast setup guide (~2 hours)
- ✅ `SETUP.md` - Detailed step-by-step instructions
- ✅ `ARCHITECTURE.md` - Architecture diagrams and explanations

---

## 🚀 Quick Start Guide

### Step 1: Prepare AWS (15 minutes)

1. **Launch EC2 Instance**:
   - Go to AWS Console → EC2 → Launch Instance
   - Choose: Ubuntu 22.04 LTS
   - Instance Type: `t3.medium`
   - Security Group: Allow ports 22, 80, 443, 8080
   - Launch and note the Public IP

2. **Connect to EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
   ```

### Step 2: Automated Setup (30 minutes)

```bash
# Clone your repository
git clone https://github.com/yourusername/url-shortener.git
cd url-shortener

# Make scripts executable
chmod +x deployment/*.sh

# Run automated setup
./deployment/setup-ec2.sh

# IMPORTANT: Log out and back in
exit
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
cd url-shortener
```

**This installs:**
- ✅ Docker
- ✅ K3s (Kubernetes)
- ✅ Jenkins
- ✅ Local Docker Registry

### Step 3: Deploy Application (15 minutes)

```bash
# Run deployment script
./deployment/deploy-k8s.sh
```

**You'll be asked for:**
- Neon Database URL
- Upstash Redis URL
- Upstash Redis Token

### Step 4: Configure Jenkins (20 minutes)

1. **Access Jenkins**: `http://<EC2-PUBLIC-IP>:8080`

2. **Get password**:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

3. **Setup**:
   - Install suggested plugins
   - Create admin user
   - Install: Docker Pipeline, Kubernetes CLI

4. **Create Pipeline**:
   - New Item → Pipeline
   - Name: `url-shortener-blue-green`
   - Pipeline from SCM → Git
   - Repository: Your GitHub URL
   - Script Path: `Jenkinsfile`
   - Save

### Step 5: Test Deployment (10 minutes)

1. **Trigger Build**: Jenkins → Build Now

2. **Check Status**:
   ```bash
   ./deployment/check-status.sh
   ```

3. **Access Application**:
   ```bash
   # Get the URL
   kubectl get svc url-shortener-service -n url-shortener
   
   # Open in browser
   http://<EC2-PUBLIC-IP>:<NodePort>
   ```

---

## 💰 Cost Estimate

### Option A: Standard Setup (~$35/month)
- EC2 t3.medium: $30
- Storage: $3
- Data Transfer: $2

### Option B: Optimized (~$18/month)
- EC2 t3.small: $15
- Storage: $2
- Data Transfer: $1

### Option C: Free Tier (First 12 months)
- EC2 t2.micro: $0
- Storage (30GB): $0
- Data Transfer (15GB): $0

---

## 🔄 How Blue-Green Deployment Works

### Current State
```
Traffic → Service (selector: blue) → Blue Pods (v1.0.0) ✓ Active
                                      Green Pods (v1.0.0) ○ Idle
```

### After Deployment
```
1. Jenkins builds new version (v1.1.0)
2. Deploys to Green environment
3. Runs health checks
4. Switches traffic to Green

Traffic → Service (selector: green) → Green Pods (v1.1.0) ✓ Active
                                       Blue Pods (v1.0.0) ○ Standby
```

### Instant Rollback
```
If issues detected:
kubectl patch svc url-shortener-service -n url-shortener \
  -p '{"spec":{"selector":{"version":"blue"}}}'

Traffic → Service (selector: blue) → Blue Pods (v1.0.0) ✓ Active
```

---

## 🎯 Key Features

### ✅ Zero Downtime Deployment
- New version deployed while old version serves traffic
- Traffic switches only after health checks pass

### ✅ Instant Rollback
- Previous version always running
- One command to rollback

### ✅ Automated Pipeline
- Push to GitHub → Automatic deployment
- Build → Test → Deploy → Switch

### ✅ Cost Effective
- Single EC2 instance (~$30/month)
- No expensive managed services
- Can use free tier

---

## 📚 Documentation Guide

### For Quick Setup
👉 **Start here**: `deployment/QUICKSTART.md`
- Step-by-step guide
- ~2 hours total time
- Automated scripts

### For Detailed Understanding
👉 **Read**: `deployment/SETUP.md`
- Comprehensive documentation
- Manual setup instructions
- Troubleshooting guide

### For Architecture Understanding
👉 **Read**: `deployment/ARCHITECTURE.md`
- System diagrams
- Component details
- Data flow explanations

### For Daily Operations
👉 **Use**: `deployment/README.md`
- Common commands
- Quick reference
- Troubleshooting

---

## 🛠️ Common Operations

### Check Status
```bash
./deployment/check-status.sh
```

### Rollback
```bash
./deployment/rollback.sh
```

### View Logs
```bash
# Blue environment
kubectl logs -n url-shortener -l version=blue --tail=50 -f

# Green environment
kubectl logs -n url-shortener -l version=green --tail=50 -f
```

### Manual Traffic Switch
```bash
# To Blue
kubectl patch svc url-shortener-service -n url-shortener \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# To Green
kubectl patch svc url-shortener-service -n url-shortener \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

### Scale Deployments
```bash
# Scale up
kubectl scale deployment url-shortener-blue -n url-shortener --replicas=3

# Scale down
kubectl scale deployment url-shortener-green -n url-shortener --replicas=1
```

---

## 🔒 Security Checklist

- [ ] Never commit `k8s/secret.yaml` (already in .gitignore)
- [ ] Use strong passwords for Jenkins
- [ ] Restrict EC2 security group to your IP
- [ ] Rotate database credentials regularly
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Use HTTPS in production (add SSL certificate)

---

## 🐛 Troubleshooting

### Pods Not Starting?
```bash
kubectl get pods -n url-shortener
kubectl describe pod <pod-name> -n url-shortener
kubectl logs <pod-name> -n url-shortener
```

### Jenkins Build Failing?
```bash
# Check Jenkins can access kubectl
sudo -u jenkins kubectl get nodes

# Fix permissions
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

### Can't Access Application?
```bash
# Check service
kubectl get svc -n url-shortener

# Check pods are ready
kubectl get pods -n url-shortener

# Verify security group allows traffic
```

---

## 📈 Next Steps

1. **Set up domain name** and point to EC2 IP
2. **Configure SSL/TLS** with Let's Encrypt
3. **Set up GitHub webhooks** for automatic builds
4. **Add monitoring** with Prometheus/Grafana
5. **Configure alerts** for failures
6. **Set up backup strategy**

---

## 🎓 What You'll Learn

By completing this setup, you'll gain hands-on experience with:

- ✅ Docker containerization
- ✅ Kubernetes orchestration
- ✅ CI/CD pipelines with Jenkins
- ✅ Blue-Green deployment strategy
- ✅ AWS EC2 management
- ✅ Infrastructure as Code
- ✅ DevOps best practices

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section in `deployment/SETUP.md`
2. Review Jenkins console logs
3. Check Kubernetes events: `kubectl get events -n url-shortener`
4. Review pod logs: `kubectl logs -n url-shortener <pod-name>`

---

## 🎉 You're Ready!

Everything is set up and ready to go. Follow the Quick Start Guide above to deploy your URL Shortener with automated Blue-Green deployment!

**Total Setup Time**: ~2 hours  
**Monthly Cost**: ~$35 (or $0 with free tier)  
**Deployment Time**: ~5 minutes (automated)  
**Rollback Time**: ~10 seconds

---

**Happy Deploying! 🚀**

For detailed instructions, start with: `deployment/QUICKSTART.md`

