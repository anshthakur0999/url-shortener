# ✅ Blue-Green Deployment Setup Checklist

Use this checklist to track your progress through the setup process.

---

## 📋 Pre-Setup Checklist

### AWS Account Setup
- [ ] AWS account created and verified
- [ ] Billing enabled
- [ ] Credit card added (for charges beyond free tier)
- [ ] Set up billing alerts ($50/month recommended)

### External Services
- [ ] Neon PostgreSQL account created
- [ ] Neon database created
- [ ] Database URL copied (format: `postgresql://user:pass@host/db?sslmode=require`)
- [ ] Upstash Redis account created
- [ ] Upstash Redis database created
- [ ] Redis URL copied
- [ ] Redis token copied

### Local Setup
- [ ] SSH client installed
- [ ] Git installed
- [ ] Code pushed to GitHub repository
- [ ] Repository URL noted

---

## 🚀 AWS EC2 Setup

### Launch Instance
- [ ] Logged into AWS Console
- [ ] Navigated to EC2 Dashboard
- [ ] Clicked "Launch Instance"
- [ ] Named instance: `url-shortener-k3s-jenkins`
- [ ] Selected Ubuntu Server 22.04 LTS
- [ ] Selected instance type: `t3.medium` (or `t3.small` for cost savings)
- [ ] Created or selected SSH key pair
- [ ] Downloaded key pair (.pem file)
- [ ] Configured Security Group:
  - [ ] Port 22 (SSH) - Your IP only
  - [ ] Port 80 (HTTP) - Anywhere
  - [ ] Port 443 (HTTPS) - Anywhere
  - [ ] Port 8080 (Jenkins) - Your IP only
- [ ] Set storage to 30 GB gp3
- [ ] Launched instance
- [ ] Noted Public IP address: `_________________`

### Connect to Instance
- [ ] Set key permissions: `chmod 400 your-key.pem`
- [ ] Connected via SSH: `ssh -i your-key.pem ubuntu@<PUBLIC-IP>`
- [ ] Connection successful

---

## 🔧 Automated Setup

### Clone Repository
- [ ] Cloned repository: `git clone <your-repo-url>`
- [ ] Changed to directory: `cd url-shortener`
- [ ] Made scripts executable: `chmod +x deployment/*.sh`

### Run Setup Script
- [ ] Ran setup script: `./deployment/setup-ec2.sh`
- [ ] Script completed without errors
- [ ] Docker installed ✓
- [ ] K3s installed ✓
- [ ] Jenkins installed ✓
- [ ] Docker registry started ✓
- [ ] Noted Jenkins initial password: `_________________`

### Re-login for Permissions
- [ ] Exited SSH session: `exit`
- [ ] Reconnected: `ssh -i your-key.pem ubuntu@<PUBLIC-IP>`
- [ ] Changed to directory: `cd url-shortener`
- [ ] Verified Docker works: `docker ps`

---

## ☸️ Kubernetes Deployment

### Deploy Application
- [ ] Ran deployment script: `./deployment/deploy-k8s.sh`
- [ ] Entered Neon Database URL
- [ ] Entered Upstash Redis URL
- [ ] Entered Upstash Redis Token
- [ ] Script completed successfully
- [ ] Namespace created ✓
- [ ] Secrets created ✓
- [ ] ConfigMap created ✓
- [ ] Docker image built ✓
- [ ] Blue deployment created ✓
- [ ] Green deployment created ✓
- [ ] Services created ✓
- [ ] Ingress created ✓

### Verify Deployment
- [ ] Ran status check: `./deployment/check-status.sh`
- [ ] All pods running
- [ ] Services created
- [ ] Noted application URL: `_________________`

---

## 🔨 Jenkins Configuration

### Access Jenkins
- [ ] Opened browser to: `http://<EC2-PUBLIC-IP>:8080`
- [ ] Pasted initial admin password
- [ ] Clicked "Install suggested plugins"
- [ ] Waited for plugins to install

### Create Admin User
- [ ] Created admin user:
  - Username: `_________________`
  - Password: `_________________`
  - Email: `_________________`
- [ ] Saved and continued

### Install Additional Plugins
- [ ] Navigated to: Manage Jenkins → Manage Plugins
- [ ] Clicked "Available" tab
- [ ] Searched and installed:
  - [ ] Docker Pipeline
  - [ ] Kubernetes CLI
  - [ ] Git (should already be installed)
- [ ] Restarted Jenkins if required

### Configure Jenkins Permissions
- [ ] Verified Jenkins can access kubectl:
  ```bash
  sudo -u jenkins kubectl get nodes
  ```
- [ ] If failed, ran:
  ```bash
  sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
  sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
  sudo systemctl restart jenkins
  ```

---

## 🔄 Create Jenkins Pipeline

### Create Pipeline Job
- [ ] Clicked "New Item"
- [ ] Named job: `url-shortener-blue-green`
- [ ] Selected "Pipeline"
- [ ] Clicked "OK"

### Configure Pipeline
- [ ] In "General" section:
  - [ ] Checked "GitHub project"
  - [ ] Entered project URL: `_________________`

- [ ] In "Build Triggers" section:
  - [ ] Checked "Poll SCM"
  - [ ] Entered schedule: `H/5 * * * *` (every 5 minutes)

- [ ] In "Pipeline" section:
  - [ ] Selected "Pipeline script from SCM"
  - [ ] Selected "Git" as SCM
  - [ ] Entered Repository URL: `_________________`
  - [ ] Branch: `*/main` (or your branch name)
  - [ ] Script Path: `Jenkinsfile`

- [ ] Clicked "Save"

---

## 🧪 Test Deployment

### First Build
- [ ] Clicked "Build Now"
- [ ] Clicked on build number (e.g., #1)
- [ ] Clicked "Console Output"
- [ ] Watched build progress
- [ ] Build completed successfully ✓

### Verify Deployment
- [ ] Ran status check: `./deployment/check-status.sh`
- [ ] Verified active environment
- [ ] Checked pods are running
- [ ] Accessed application in browser
- [ ] Application loads successfully ✓

### Test Blue-Green Switch
- [ ] Made a small code change (e.g., update text in `app/page.tsx`)
- [ ] Committed and pushed to GitHub
- [ ] Waited for Jenkins to detect change (up to 5 minutes)
- [ ] Watched Jenkins build
- [ ] Verified deployment to inactive environment
- [ ] Verified traffic switch
- [ ] Checked application shows new changes ✓

---

## 🎯 Post-Deployment Tasks

### Test Rollback
- [ ] Ran rollback script: `./deployment/rollback.sh`
- [ ] Confirmed rollback
- [ ] Verified traffic switched back
- [ ] Application shows previous version ✓
- [ ] Switched back to new version (if desired)

### Monitor Application
- [ ] Checked pod logs:
  ```bash
  kubectl logs -n url-shortener -l app=url-shortener --tail=50
  ```
- [ ] No errors in logs ✓
- [ ] Application responding correctly ✓

### Document Your Setup
- [ ] Noted EC2 Public IP: `_________________`
- [ ] Noted Application URL: `_________________`
- [ ] Noted Jenkins URL: `_________________`
- [ ] Saved credentials securely
- [ ] Documented any custom configurations

---

## 🔒 Security Hardening

### EC2 Security
- [ ] Reviewed security group rules
- [ ] Restricted SSH to your IP only
- [ ] Restricted Jenkins (8080) to your IP only
- [ ] Enabled automatic security updates:
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

### Kubernetes Secrets
- [ ] Verified `k8s/secret.yaml` is NOT in git
- [ ] Verified `.gitignore` includes `k8s/secret.yaml`
- [ ] Stored credentials in password manager

### Jenkins Security
- [ ] Changed default admin password
- [ ] Enabled CSRF protection (should be default)
- [ ] Configured proper user permissions

---

## 📈 Optional Enhancements

### Domain Setup
- [ ] Purchased domain name
- [ ] Created A record pointing to EC2 IP
- [ ] Updated `k8s/ingress.yaml` with domain
- [ ] Applied changes: `kubectl apply -f k8s/ingress.yaml`

### SSL/TLS Setup
- [ ] Installed cert-manager
- [ ] Configured Let's Encrypt
- [ ] Updated ingress for HTTPS
- [ ] Verified SSL certificate

### GitHub Webhooks
- [ ] GitHub repo → Settings → Webhooks
- [ ] Added webhook URL: `http://<EC2-IP>:8080/github-webhook/`
- [ ] Selected "Just the push event"
- [ ] Saved webhook
- [ ] Removed "Poll SCM" from Jenkins (no longer needed)

### Monitoring
- [ ] Installed Prometheus
- [ ] Installed Grafana
- [ ] Configured dashboards
- [ ] Set up alerts

### Backup Strategy
- [ ] Documented backup procedure
- [ ] Set up automated backups for database
- [ ] Tested restore procedure

---

## 💰 Cost Management

### Set Up Billing Alerts
- [ ] AWS Console → Billing → Budgets
- [ ] Created budget: $50/month
- [ ] Set up email alerts at 80% and 100%

### Monitor Costs
- [ ] Reviewed current month's costs
- [ ] Verified costs are within budget
- [ ] Identified any unexpected charges

### Optimization
- [ ] Considered downsizing to t3.small if t3.medium is overkill
- [ ] Set up auto-stop for non-production hours (if applicable)
- [ ] Reviewed and cleaned up unused resources

---

## 🎓 Learning Objectives Achieved

- [ ] Understand Docker containerization
- [ ] Understand Kubernetes orchestration
- [ ] Understand CI/CD pipelines
- [ ] Understand Blue-Green deployment strategy
- [ ] Understand AWS EC2 management
- [ ] Understand Infrastructure as Code
- [ ] Can deploy applications with zero downtime
- [ ] Can rollback deployments quickly
- [ ] Can troubleshoot deployment issues

---

## 📝 Notes

Use this space to document any issues, solutions, or customizations:

```
_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________
```

---

## ✅ Final Verification

- [ ] Application is accessible
- [ ] Blue-Green deployment works
- [ ] Rollback works
- [ ] Jenkins pipeline runs automatically
- [ ] All pods are healthy
- [ ] Logs show no errors
- [ ] Costs are within budget
- [ ] Security is properly configured
- [ ] Documentation is complete

---

## 🎉 Congratulations!

If all items are checked, you have successfully deployed your URL Shortener with automated Blue-Green deployment!

**Next Steps:**
1. Share your project (add URL to resume/portfolio)
2. Monitor application performance
3. Implement additional features
4. Consider adding more environments (staging, QA)
5. Explore advanced Kubernetes features

---

**Setup Date**: _______________  
**Completed By**: _______________  
**Total Time**: _______________ hours

