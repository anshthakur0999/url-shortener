# 🚀 Quick Start Guide - Blue-Green Deployment

This is the **fastest way** to get your URL Shortener running with Blue-Green deployment on AWS.

---

## ⏱️ Time Required: ~2 hours

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] AWS Account with billing enabled
- [ ] Neon PostgreSQL database URL (get from [neon.tech](https://neon.tech))
- [ ] Upstash Redis URL and Token (get from [upstash.com](https://upstash.com))
- [ ] SSH key pair for EC2
- [ ] Your code pushed to GitHub

---

## 🎯 Step-by-Step Setup

### Step 1: Launch EC2 Instance (10 minutes)

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Configure**:
   - Name: `url-shortener-k3s`
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: `t3.medium`
   - Key Pair: Select or create new
   - Security Group: Allow ports 22, 80, 443, 8080

3. **Launch** and note the **Public IP**

---

### Step 2: Connect and Run Setup Script (30 minutes)

```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# 2. Clone your repository
git clone https://github.com/yourusername/url-shortener.git
cd url-shortener

# 3. Make scripts executable
chmod +x deployment/*.sh

# 4. Run automated setup
./deployment/setup-ec2.sh

# 5. IMPORTANT: Log out and back in for Docker permissions
exit
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
cd url-shortener
```

**What this does:**
- ✅ Installs Docker
- ✅ Installs K3s (Kubernetes)
- ✅ Installs Jenkins
- ✅ Sets up local Docker registry
- ✅ Configures everything automatically

---

### Step 3: Deploy to Kubernetes (15 minutes)

```bash
# Run the deployment script
./deployment/deploy-k8s.sh
```

**You'll be prompted for:**
- Neon Database URL
- Upstash Redis URL
- Upstash Redis Token

**What this does:**
- ✅ Creates Kubernetes namespace
- ✅ Creates secrets with your credentials
- ✅ Builds Docker image
- ✅ Deploys Blue and Green environments
- ✅ Creates services and ingress

---

### Step 4: Configure Jenkins (20 minutes)

1. **Access Jenkins**:
   ```
   http://<EC2-PUBLIC-IP>:8080
   ```

2. **Get initial password**:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

3. **Setup Jenkins**:
   - Paste password
   - Install suggested plugins
   - Create admin user
   - Install additional plugins:
     - Docker Pipeline
     - Kubernetes CLI

4. **Create Pipeline Job**:
   - New Item → Pipeline
   - Name: `url-shortener-blue-green`
   - Pipeline from SCM → Git
   - Repository URL: `https://github.com/yourusername/url-shortener.git`
   - Script Path: `Jenkinsfile`
   - Save

5. **Update Jenkinsfile** (if using Docker Hub):
   ```groovy
   environment {
       DOCKER_REGISTRY = 'localhost:5000'  // Keep for local registry
   }
   ```

---

### Step 5: Test Blue-Green Deployment (10 minutes)

1. **Trigger first build**:
   - Go to Jenkins → `url-shortener-blue-green`
   - Click "Build Now"
   - Watch Console Output

2. **Check deployment**:
   ```bash
   ./deployment/check-status.sh
   ```

3. **Access your application**:
   ```bash
   # Get the URL
   kubectl get svc url-shortener-service -n url-shortener
   
   # Access via browser
   http://<EC2-PUBLIC-IP>:<NodePort>
   ```

4. **Test Blue-Green switch**:
   - Make a code change
   - Push to GitHub
   - Trigger Jenkins build
   - Watch it deploy to the other environment
   - Traffic automatically switches!

---

## 🎉 You're Done!

Your URL Shortener is now running with automated Blue-Green deployment!

---

## 🔄 Common Operations

### Check Status
```bash
./deployment/check-status.sh
```

### Manual Rollback
```bash
./deployment/rollback.sh
```

### View Logs
```bash
# Blue environment
kubectl logs -n url-shortener -l version=blue --tail=50

# Green environment
kubectl logs -n url-shortener -l version=green --tail=50
```

### Manually Switch Traffic
```bash
# Switch to Blue
kubectl patch svc url-shortener-service -n url-shortener \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Switch to Green
kubectl patch svc url-shortener-service -n url-shortener \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

### Scale Deployments
```bash
# Scale Blue to 3 replicas
kubectl scale deployment url-shortener-blue -n url-shortener --replicas=3

# Scale Green to 3 replicas
kubectl scale deployment url-shortener-green -n url-shortener --replicas=3
```

---

## 💰 Cost Estimate

**Monthly Cost: ~$35**
- EC2 t3.medium: ~$30
- EBS Storage: ~$3
- Data Transfer: ~$2

**To reduce costs:**
- Use t3.small instead (~$15/month)
- Stop instance when not in use
- Use AWS Free Tier (first 12 months)

---

## 🐛 Troubleshooting

### Pods not starting?
```bash
kubectl get pods -n url-shortener
kubectl describe pod <pod-name> -n url-shortener
kubectl logs <pod-name> -n url-shortener
```

### Jenkins can't access Kubernetes?
```bash
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

### Can't access application?
```bash
# Check service
kubectl get svc -n url-shortener

# Check if pods are ready
kubectl get pods -n url-shortener

# Check security group allows traffic on the NodePort
```

---

## 📚 Next Steps

1. **Set up domain**: Point your domain to EC2 IP
2. **Enable SSL**: Use Let's Encrypt with cert-manager
3. **GitHub Webhooks**: Auto-trigger builds on push
4. **Monitoring**: Add Prometheus/Grafana
5. **Alerts**: Set up AWS CloudWatch alarms

---

## 🆘 Need Help?

- Check `deployment/SETUP.md` for detailed documentation
- Review Jenkins console logs
- Check Kubernetes events: `kubectl get events -n url-shortener`

---

**Happy Deploying! 🚀**

