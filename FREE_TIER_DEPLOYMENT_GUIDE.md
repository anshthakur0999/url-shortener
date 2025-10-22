# 🚀 AWS Free Tier Blue-Green Deployment - QUICK START
## For College Assignment (Budget: $0, Timeline: 2 Weeks)

---

## TL;DR - The Simplest Path

### What You're Building
```
Your Code (GitHub) 
    ↓
CodePipeline (watches for pushes)
    ↓
CodeBuild (builds Docker image)
    ↓
CodeDeploy (deploys Blue-Green on EC2)
    ↓
EC2 t2.micro (runs 2 Docker containers + Nginx)
    ↓
Zero-downtime deployments every time 🎉
```

### Cost: **COMPLETELY FREE**
- EC2 t2.micro: FREE (12 months)
- CodePipeline: FREE
- CodeBuild: FREE (750 min/month)
- CodeDeploy: FREE
- **Total: $0/month** ✅

---

## 📋 Prerequisites

```
☐ AWS free tier account (create at aws.amazon.com/free)
☐ GitHub account with url-shortener repo
☐ Git installed locally
☐ Docker installed locally (for testing)
☐ Code editor (VS Code recommended)
```

---

## ⏱️ Setup Timeline (14 Days)

### **Days 1-2: AWS Account & Security**
```bash
1. Create AWS free tier account
2. Set billing alert to $5/month (IMPORTANT!)
3. Create IAM user "codepipeline" (never use root account)
4. Save access keys securely
5. Enable 2FA on account

Time: 2 hours
Cost: $0
```

### **Days 3-4: Create EC2 Instance**
```bash
1. Launch t2.micro EC2 (free tier only!)
2. Ubuntu 24.04 LTS
3. 30GB storage (free tier allows this)
4. Add security group for HTTP/HTTPS/SSH
5. Run user data script (installs Docker + Nginx)
6. Save key pair PEM file

Time: 2 hours
Cost: $0
```

### **Days 5-6: Create Configuration Files**
```bash
1. Create Dockerfile (in repo root)
2. Create buildspec.yml (CodeBuild config)
3. Create appspec.yaml (CodeDeploy config)
4. Create scripts/ folder with deployment scripts
5. Add health check endpoint to Next.js app
6. Test Dockerfile locally

Time: 3 hours
Cost: $0
```

### **Days 7-8: Create AWS Services**
```bash
1. Create ECR repository (stores Docker images)
2. Create CodeBuild project
3. Create CodeDeploy application
4. Create CodePipeline
5. Connect GitHub with OAuth token

Time: 3 hours
Cost: $0
```

### **Days 9-10: First Deployment**
```bash
1. Push code to GitHub main branch
2. Watch CodePipeline trigger
3. Watch CodeBuild build Docker image
4. Watch CodeDeploy deploy to EC2
5. Verify app is running
6. Test blue-green switch works

Time: 2 hours
Cost: $0
```

### **Days 11-12: Testing & Monitoring**
```bash
1. Test deployment multiple times
2. Practice rollback
3. Setup CloudWatch monitoring
4. Create health check dashboard
5. Verify billing still at $0

Time: 3 hours
Cost: $0 (or close to it)
```

### **Days 13-14: Documentation**
```bash
1. Screenshot all pipeline stages
2. Create architecture diagrams
3. Write setup guide
4. Prepare presentation
5. Final verification checklist

Time: 3 hours
Cost: $0
```

---

## 🎯 Core Files (What You Need to Create)

### File 1: `Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY public ./public

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
```

### File 2: `buildspec.yml`
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Logging in to ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/url-shortener
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      
  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $REPOSITORY_URI:$IMAGE_TAG .
      - docker tag $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:latest
      
  post_build:
    commands:
      - echo "Pushing to ECR..."
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - docker push $REPOSITORY_URI:latest
      - printf '[{"name":"url-shortener","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files: imagedefinitions.json
```

### File 3: `appspec.yaml`
```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::EC2::Instance
      Properties:
        Name: url-shortener

Hooks:
  ApplicationStop:
    - Location: scripts/stop_server.sh
      Timeout: 60
      RunAs: root
  
  BeforeBlockTraffic:
    - Location: scripts/before_block_traffic.sh
      Timeout: 60
      RunAs: root
  
  ApplicationStart:
    - Location: scripts/start_server.sh
      Timeout: 300
      RunAs: root
  
  ValidateService:
    - Location: scripts/validate_service.sh
      Timeout: 300
      RunAs: root
```

### File 4: `app/api/health/route.ts` (Health Endpoint)
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
```

### File 5: `scripts/start_server.sh`
```bash
#!/bin/bash
set -e

# Pull latest image
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/url-shortener:latest

# Start new container (Blue)
docker run -d \
  --name url-shortener-blue \
  -p 3001:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e KV_REST_API_URL=$KV_REST_API_URL \
  -e KV_REST_API_TOKEN=$KV_REST_API_TOKEN \
  -e NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/url-shortener:latest

# Wait for health check
sleep 30
curl http://localhost:3001/health || exit 1
```

### File 6: `scripts/stop_server.sh`
```bash
#!/bin/bash
set -e

# Rename current container as Green (backup)
docker rename url-shortener-blue url-shortener-green || true
docker stop url-shortener-green || true
```

### File 7: `scripts/validate_service.sh`
```bash
#!/bin/bash
set -e

# Test health endpoint
curl -f http://localhost:3001/health || exit 1

# Test API endpoint
curl -f -X POST http://localhost:3001/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' || exit 1

echo "Health checks passed!"
```

### File 8: `scripts/before_block_traffic.sh`
```bash
#!/bin/bash
# Switch Nginx upstream from Green to Blue
sudo sed -i 's/server localhost:3002;/server localhost:3001;/' /etc/nginx/sites-enabled/default
sudo nginx -s reload
echo "Traffic switched to Blue"
```

---

## 🚀 Step-by-Step AWS Setup

### Step 1: Create AWS Account (15 min)
```bash
1. Go to https://aws.amazon.com/free
2. Click "Create a Free Account"
3. Enter email and password
4. Verify email
5. Add billing information (NO CHARGE for free tier)
6. Verify phone number
7. Select "Basic" support plan

⚠️ IMMEDIATELY: Set billing alert
   AWS Console → Budgets → Create Budget
   Set to $5/month (safety net)
```

### Step 2: Create IAM User (10 min)
```bash
AWS Console → IAM → Users:

1. Create user: codepipeline-user
2. Attach policies:
   - AmazonEC2ContainerRegistryFullAccess
   - AmazonEC2FullAccess
   - AWSCodePipelineFullAccess
   - AWSCodeBuildAdminAccess
   - AWSCodeDeployRoleForEC2
3. Create access key (save to ~/.aws/credentials)
```

### Step 3: Launch EC2 Instance (20 min)
```bash
AWS Console → EC2 → Instances → Launch:

Name: url-shortener-blue-green
AMI: Ubuntu Server 24.04 LTS
Instance Type: t2.micro ⚠️ MUST BE FREE TIER!
Key Pair: Create new "url-shortener-key"
Security Group: Allow 80, 443, 22
Storage: 30 GB (free tier allows this)

Advanced → User data:
(Paste script from ASSIGNMENT_ROADMAP.md)
```

### Step 4: Create ECR Repository (5 min)
```bash
AWS Console → ECR → Create repository:

Name: url-shortener
Scan on push: Enable
Tag immutability: Disable
Leave other defaults
```

### Step 5: Create CodeBuild Project (10 min)
```bash
AWS Console → CodeBuild → Create build project:

Project name: url-shortener-build
Source: GitHub (connect account)
Repository: url-shortener
Buildspec: Use buildspec.yml from source
Environment:
  - OS: Ubuntu
  - Runtime: Standard
  - Image: aws/codebuild/standard:7.0
Service role: Create new role
```

### Step 6: Create CodeDeploy App (10 min)
```bash
AWS Console → CodeDeploy → Create application:

Application name: url-shortener
Compute platform: EC2/On-premises

Create deployment group:
  Name: url-shortener-deployment-group
  Service role: Create new CodeDeployRole
  Deployment type: Blue/green ✅
  Instances:
    - Add tag: Name = url-shortener-blue-green
  Load balancer: None (we use Nginx)
  Termination wait time: 0
```

### Step 7: Create CodePipeline (10 min)
```bash
AWS Console → CodePipeline → Create pipeline:

Pipeline name: url-shortener-pipeline
Service role: Create new role

Source Stage:
  - Provider: GitHub (v2)
  - Repository: url-shortener
  - Branch: main
  - Trigger: Push

Build Stage:
  - Provider: AWS CodeBuild
  - Project: url-shortener-build

Deploy Stage:
  - Provider: AWS CodeDeploy
  - Application: url-shortener
  - Deployment group: url-shortener-deployment-group

Review & Create
```

---

## 🧪 Testing (What Happens Next)

### Test 1: First Deployment
```bash
1. Commit code to GitHub main branch
2. GitHub webhook triggers CodePipeline
3. Watch CodeBuild build (takes ~4-5 minutes)
4. Watch CodeDeploy deploy (takes ~3-5 minutes)
5. SSH into EC2 and verify:
   docker ps
   curl localhost:3001/health
   curl localhost:80
```

### Test 2: Second Deployment
```bash
1. Make small code change (e.g., update README)
2. git push origin main
3. Pipeline triggers again
4. Watch traffic switch from Blue to Green (previous version)
5. Verify app still works at http://<EC2_IP>
```

### Test 3: Rollback
```bash
1. SSH into EC2
2. docker ps (see Blue running on 3001)
3. docker stop url-shortener-blue
4. docker start url-shortener-green
5. Update Nginx: sed -i 's/:3001/:3002/' /etc/nginx/sites-enabled/default
6. sudo nginx -s reload
7. curl localhost:80 (should work with old version)
8. Verify traffic went from port 3001 → 3002
```

---

## 💰 Cost Verification

### Check AWS Billing (Do This Weekly!)
```bash
AWS Console → Billing → Cost Explorer:

1. Time period: Last 30 days
2. Granularity: Daily
3. Group by: Service

What you should see:
  ✅ EC2: $0 (free tier)
  ✅ CodeBuild: $0 (750 min free)
  ✅ CodeDeploy: $0 (free)
  ✅ ECR: ~$0.50 (5GB free, minimal overage)
  ✅ Total: $0-1 (should be ZERO)

If you see charges:
  ❌ Stop EC2 immediately
  ❌ Check for Load Balancer (costs $16/month)
  ❌ Check for extra instances
  ❌ Delete any unneeded resources
```

---

## 📝 Documentation Checklist

### For Assignment Submission
```
✅ Code Files:
   - Dockerfile (in repo root)
   - buildspec.yml (in repo root)
   - appspec.yaml (in repo root)
   - scripts/ folder with shell scripts
   - app/api/health/route.ts (health endpoint)

✅ Documentation:
   - README with AWS setup instructions
   - ASSIGNMENT_ROADMAP.md (this was created)
   - Architecture diagram (draw.io or similar)
   - Screenshot of CodePipeline running
   - Screenshot of CodeDeploy success
   - Screenshot of app working
   - Screenshot of AWS billing ($0)

✅ Presentation:
   - Slide deck (Google Slides / PowerPoint)
   - Demo video (if live demo risky)
   - Talking points (1 page)
   - Q&A answers prepared

✅ Git Repository:
   - All files committed and pushed
   - Clear commit messages
   - README updated
   - No secrets in code
```

---

## ⚠️ Critical Warnings (READ THIS!)

### Don't Do These (They Cost Money)
```
❌ Application Load Balancer    → $16.43/month
❌ RDS Database                 → $15+/month
❌ NAT Gateway                  → $32+/month
❌ Multiple EC2 instances       → $10+/month each
❌ CloudFront CDN               → $0.085/GB
❌ Elastic IP (if not used)     → $3.65/month
❌ Data transfer outbound       → $0.09/GB
```

### Do These Instead (Stay Free)
```
✅ Use t2.micro EC2                → FREE
✅ Use Neon PostgreSQL             → Already setup
✅ Use Upstash Redis               → Already setup
✅ Use Security Groups for routing → FREE
✅ Use Nginx for traffic switching → FREE
✅ Use CloudWatch basic            → FREE
```

---

## 🔧 Troubleshooting

### "CodeBuild failing to login to ECR"
```
Fix:
1. Check IAM role has ECR permissions
2. Verify AWS account ID in buildspec.yml
3. Check AWS region is correct
4. Recreate CodeBuild project with correct role
```

### "CodeDeploy stuck/failing"
```bash
SSH into EC2:
  ssh -i url-shortener-key.pem ubuntu@<PUBLIC_IP>

Check CodeDeploy agent:
  sudo systemctl status codedeploy-agent
  sudo systemctl restart codedeploy-agent

View logs:
  cat /var/log/codedeploy-agent/deployments/*/logs/scripts.log
  docker logs url-shortener-blue
```

### "Health check timing out"
```bash
SSH into EC2 and test manually:
  docker ps (see running containers)
  docker logs url-shortener-blue (check errors)
  curl localhost:3001/health (test endpoint)
  curl localhost:3000/health (inside container)

If health endpoint missing:
  1. Add app/api/health/route.ts
  2. Rebuild Docker image
  3. Push to GitHub
  4. Pipeline will redeploy
```

### "Traffic not switching (stuck on Green)"
```bash
SSH into EC2:
  sudo cat /etc/nginx/sites-enabled/default (see current config)
  curl localhost:3001 (test Blue)
  curl localhost:3002 (test Green)
  
Manually switch:
  sudo sed -i 's/server localhost:3002;/server localhost:3001;/' /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo nginx -s reload
  curl localhost (test through Nginx)
```

---

## 📊 What Professor Will Ask

### Expected Questions
```
Q: "How does blue-green deployment work?"
A: "We run two containers simultaneously. Code deploys to Blue,
   gets health checked, then Nginx switches traffic. If it fails,
   we switch back to Green instantly."

Q: "How does it handle zero downtime?"
A: "Nginx validates health before switching. Users never see errors
   because traffic stays on Green until Blue is ready."

Q: "Why use AWS free tier?"
A: "t2.micro EC2 is free. CodeBuild 750 min free. CodeDeploy free.
   Only Neon DB and Upstash Redis are external (already paid for)."

Q: "What happens after 12 months?"
A: "EC2 t2.micro becomes ~$10/month. Everything else stays free.
   Could migrate to Lambda/Fargate if budget concerned."

Q: "How do you prevent failed deployments?"
A: "Health checks validate before traffic switch. If /health fails,
   deployment aborts and Green keeps serving."

Q: "Can you rollback?"
A: "Yes, instantly! Traffic switches back to Green in <1 second.
   Or redeploy specific Git commit via CodePipeline."
```

---

## ✅ Final Checklist (Before Submitting)

```
Code:
  ☐ Dockerfile in repo root
  ☐ buildspec.yml in repo root
  ☐ appspec.yaml in repo root
  ☐ scripts/ folder exists with all .sh files
  ☐ Health endpoint at app/api/health/route.ts
  ☐ All files committed to GitHub
  ☐ No secrets or API keys in code

AWS Setup:
  ☐ EC2 instance running (t2.micro)
  ☐ ECR repository created
  ☐ CodeBuild project created
  ☐ CodeDeploy application created
  ☐ CodePipeline created and working
  ☐ Billing shows $0 (check today)

Testing:
  ☐ First deployment succeeded
  ☐ App accessible via EC2 IP
  ☐ Health endpoint returns 200
  ☐ URL shortening works
  ☐ Second deployment succeeded
  ☐ Traffic switched between versions
  ☐ Rollback tested and works

Documentation:
  ☐ README updated with AWS setup
  ☐ Screenshots of pipeline stages
  ☐ Architecture diagram included
  ☐ Talking points prepared
  ☐ Presentation deck ready
  ☐ All files in repo root

Ready to Submit:
  ☐ GitHub repo has all files
  ☐ AWS services tested and working
  ☐ Documentation complete
  ☐ Presentation prepared
  ☐ Cost verified at $0
```

---

## 🎓 Key Learnings to Explain

```
1. Blue-Green Deployment
   "Why it's better than traditional deployments:
    - Zero downtime: Users never see errors
    - Instant rollback: Traffic back in <1 second
    - Safety: Health checks validate before switching"

2. CI/CD Pipeline Automation
   "How CodePipeline saves manual work:
    - Automatic build on every GitHub push
    - Automatic testing before deployment
    - Automatic deployment to EC2
    - Less human error, faster deployments"

3. Docker Containerization
   "Why Docker matters:
    - Same environment everywhere (local, staging, prod)
    - Consistent dependencies
    - Easy scaling (run multiple containers)"

4. AWS Services
   "Why we used specific services:
    - CodeBuild: Managed build service (no Jenkins to maintain)
    - CodeDeploy: Handles orchestration (no manual SSH)
    - EC2 t2.micro: Free tier learning environment
    - ECR: Private container registry (more secure than Docker Hub)"

5. Cost Optimization
   "How we stayed free:
    - No Load Balancer (costs $16/month, we use Nginx)
    - No RDS (already using Neon)
    - Single t2.micro instance (free tier)
    - Minimal data transfer
    - No extra services"
```

---

## 🚀 You're Ready!

**Next steps:**
1. Create AWS account
2. Set billing alert
3. Follow step-by-step setup
4. Test first deployment
5. Document and present

**Good luck! This is a solid project.** 🎉

Questions? Reference ASSIGNMENT_ROADMAP.md for detailed info.

