# 🚀 Blue-Green Deployment for URL Shortener

Automated Blue-Green deployment strategy using **Jenkins**, **Kubernetes (K3s)**, and **Docker** on AWS EC2.

---

## 📁 Files Overview

```
deployment/
├── README.md              # This file
├── QUICKSTART.md          # Fast setup guide (START HERE!)
├── SETUP.md               # Detailed setup documentation
├── setup-ec2.sh           # Automated EC2 setup script
├── deploy-k8s.sh          # Kubernetes deployment script
├── rollback.sh            # Quick rollback script
└── check-status.sh        # Status monitoring script

k8s/
├── namespace.yaml         # Kubernetes namespace
├── configmap.yaml         # Configuration
├── secret.yaml.example    # Secret template (create actual secret.yaml)
├── deployment-blue.yaml   # Blue environment deployment
├── deployment-green.yaml  # Green environment deployment
├── service.yaml           # Services (main + blue + green)
└── ingress.yaml           # Ingress configuration

Dockerfile                 # Multi-stage Docker build
.dockerignore             # Docker build exclusions
Jenkinsfile               # CI/CD pipeline definition
```

---

## 🎯 What is Blue-Green Deployment?

Blue-Green deployment is a release strategy that reduces downtime and risk by running two identical production environments:

- **Blue**: Currently running version (production)
- **Green**: New version being deployed

### How it Works:

1. **Deploy to Green** while Blue serves traffic
2. **Test Green** environment
3. **Switch traffic** from Blue to Green
4. **Keep Blue** as instant rollback option

### Benefits:

✅ **Zero downtime** deployments  
✅ **Instant rollback** capability  
✅ **Test in production** environment before switching  
✅ **Reduced risk** of deployment failures  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS EC2                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    K3s Cluster                         │ │
│  │                                                        │ │
│  │  ┌──────────────┐              ┌──────────────┐      │ │
│  │  │   Blue Pod   │              │  Green Pod   │      │ │
│  │  │  (v1.0.0)    │              │  (v1.1.0)    │      │ │
│  │  └──────┬───────┘              └──────┬───────┘      │ │
│  │         │                              │              │ │
│  │         └──────────┬───────────────────┘              │ │
│  │                    │                                  │ │
│  │         ┌──────────▼──────────┐                      │ │
│  │         │  Service (Selector) │                      │ │
│  │         │  version: blue/green│                      │ │
│  │         └──────────┬──────────┘                      │ │
│  │                    │                                  │ │
│  │         ┌──────────▼──────────┐                      │ │
│  │         │   LoadBalancer/     │                      │ │
│  │         │   NodePort          │                      │ │
│  │         └──────────┬──────────┘                      │ │
│  └────────────────────┼─────────────────────────────────┘ │
│                       │                                    │
│  ┌────────────────────▼─────────────────────────────────┐ │
│  │                  Jenkins                              │ │
│  │  - Build Docker Image                                │ │
│  │  - Push to Registry                                  │ │
│  │  - Deploy to Target Environment                      │ │
│  │  - Run Health Checks                                 │ │
│  │  - Switch Traffic                                    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  External Services     │
              │  - Neon PostgreSQL     │
              │  - Upstash Redis       │
              └────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# 1. Launch EC2 instance (t3.medium, Ubuntu 22.04)
# 2. Connect via SSH
ssh -i your-key.pem ubuntu@<EC2-IP>

# 3. Clone repository
git clone https://github.com/yourusername/url-shortener.git
cd url-shortener

# 4. Run setup script
chmod +x deployment/*.sh
./deployment/setup-ec2.sh

# 5. Log out and back in
exit
ssh -i your-key.pem ubuntu@<EC2-IP>
cd url-shortener

# 6. Deploy to Kubernetes
./deployment/deploy-k8s.sh

# 7. Configure Jenkins (see QUICKSTART.md)
```

### Option 2: Manual Setup

See `SETUP.md` for detailed step-by-step instructions.

---

## 📊 Deployment Flow

### Automated Pipeline (Jenkins)

```
1. Code Push to GitHub
         ↓
2. Jenkins Detects Change
         ↓
3. Build Docker Image
         ↓
4. Push to Registry
         ↓
5. Detect Active Environment (Blue/Green)
         ↓
6. Deploy to Inactive Environment
         ↓
7. Run Health Checks
         ↓
8. Switch Traffic to New Environment
         ↓
9. Keep Old Environment for Rollback
```

### Manual Deployment

```bash
# 1. Build and push image
docker build -t localhost:5000/url-shortener:v1.1.0 .
docker push localhost:5000/url-shortener:v1.1.0

# 2. Update deployment
kubectl set image deployment/url-shortener-green \
  url-shortener=localhost:5000/url-shortener:v1.1.0 \
  -n url-shortener

# 3. Wait for rollout
kubectl rollout status deployment/url-shortener-green -n url-shortener

# 4. Switch traffic
kubectl patch svc url-shortener-service -n url-shortener \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

---

## 🔧 Common Operations

### Check Deployment Status
```bash
./deployment/check-status.sh
```

### Rollback to Previous Version
```bash
./deployment/rollback.sh
```

### View Logs
```bash
# Blue environment
kubectl logs -n url-shortener -l version=blue --tail=100 -f

# Green environment
kubectl logs -n url-shortener -l version=green --tail=100 -f
```

### Scale Deployments
```bash
# Scale up
kubectl scale deployment url-shortener-blue -n url-shortener --replicas=3

# Scale down
kubectl scale deployment url-shortener-green -n url-shortener --replicas=1
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

---

## 💰 Cost Breakdown

### Monthly Costs (~$35)

| Component | Cost |
|-----------|------|
| EC2 t3.medium (730 hrs) | ~$30 |
| EBS Storage (30 GB) | ~$3 |
| Data Transfer | ~$2 |
| **Total** | **~$35** |

### Cost Optimization

1. **Use Spot Instances**: Save 70%
2. **Downgrade to t3.small**: Save 50%
3. **Stop when not in use**: Pay only when running
4. **AWS Free Tier**: First 12 months free for t2.micro

---

## 🔒 Security Best Practices

1. **Never commit secrets**:
   - Use `k8s/secret.yaml.example` as template
   - Create actual `k8s/secret.yaml` locally
   - It's already in `.gitignore`

2. **Secure EC2**:
   - Restrict SSH to your IP only
   - Use security groups properly
   - Keep system updated

3. **Kubernetes secrets**:
   - Use `kubectl create secret` command
   - Don't store in version control
   - Rotate credentials regularly

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n url-shortener

# Describe pod
kubectl describe pod <pod-name> -n url-shortener

# Check logs
kubectl logs <pod-name> -n url-shortener
```

### Jenkins Build Failing

```bash
# Check Jenkins logs
sudo journalctl -u jenkins -f

# Verify Jenkins can access kubectl
sudo -u jenkins kubectl get nodes

# Fix permissions
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
```

### Image Pull Errors

```bash
# Check registry
curl http://localhost:5000/v2/_catalog

# Rebuild and push
docker build -t localhost:5000/url-shortener:latest .
docker push localhost:5000/url-shortener:latest
```

---

## 📚 Documentation

- **QUICKSTART.md**: Fast setup guide (2 hours)
- **SETUP.md**: Detailed documentation with all steps
- **Jenkinsfile**: Pipeline configuration (inline comments)
- **k8s/*.yaml**: Kubernetes manifests (inline comments)

---

## 🎓 Learning Resources

- [Kubernetes Blue-Green Deployment](https://kubernetes.io/blog/2018/04/30/zero-downtime-deployment-kubernetes-jenkins/)
- [K3s Documentation](https://docs.k3s.io/)
- [Jenkins Pipeline](https://www.jenkins.io/doc/book/pipeline/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

## 🤝 Contributing

Found an issue or want to improve the deployment?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

Same as the main project.

---

## 🆘 Support

- Check troubleshooting section
- Review Jenkins console logs
- Check Kubernetes events: `kubectl get events -n url-shortener`
- Review pod logs: `kubectl logs -n url-shortener <pod-name>`

---

**Happy Deploying! 🚀**

