# AWS Free Tier Blue-Green Deployment Guide
## URL Shortener - College Assignment Version

---

## 🎯 Assignment Strategy

### Your Constraints
- ✅ **Must use AWS**
- ✅ **Free tier only** (no charges)
- ✅ **Blue-Green deployment** (automated)
- ✅ **Jenkins/K8s/Docker** (experiment requirements)
- ✅ **Stopwatch 12-month free trial**

### Solution Architecture
```
GitHub Push (main branch)
    ↓
CodePipeline (FREE)
├─ Source: GitHub webhook
├─ Build: CodeBuild (750 min/month FREE)
└─ Deploy: CodeDeploy (FREE)
    ↓
EC2 (1x t2.micro FREE tier)
├─ Docker container (Blue)
├─ Docker container (Green)
└─ Load Balancer traffic switch
    ↓
RDS (free tier NOT enough for Neon)
    ↓
ElastiCache (free tier too small for Redis)
    ↓
CloudWatch (FREE monitoring)
```

**Key Insight:** AWS CodePipeline/CodeDeploy give you Jenkins-like automation WITHOUT self-hosting Jenkins.

---

## ⚠️ FREE TIER COST BREAKDOWN

### What's FREE (12 months)
```
✅ CodePipeline:         FREE (limited to 1 active pipeline, but enough)
✅ CodeBuild:            750 build minutes/month FREE (plenty for assignment)
✅ CodeDeploy:           FREE (unlimited deployments)
✅ EC2:                  1x t2.micro instance FREE (!)
✅ CloudWatch:           FREE monitoring, logs, alarms
✅ S3:                   5 GB storage FREE
✅ Systems Manager:      Secrets storage FREE
```

### What's PAID (Minimize These)
```
❌ RDS (no free tier)    → Use Neon PostgreSQL (external, covered by existing setup)
❌ ElastiCache (no tier) → Use Upstash Redis (external, existing setup)
❌ Load Balancer        → Use EC2 Security Groups instead (~$16-20/month)
❌ Data Transfer        → Outbound AWS charges ($0.09/GB after 1GB/month)
❌ Route53              → Use freenom or existing domain
```

### CRITICAL: Ways to Stay Free
```
1. ✅ Use ONLY 1 EC2 t2.micro instance (free tier)
2. ✅ Don't use Application Load Balancer (it costs $16/month)
3. ✅ Use Security Groups for traffic switching (instead of LB)
4. ✅ Store Docker images in ECR (5GB free, plenty)
5. ✅ Keep CodeBuild under 750 minutes/month (easy for assignment)
6. ✅ Minimal CloudWatch data retention
7. ✅ NO RDS - use Neon (external, already setup)
8. ✅ NO managed ElastiCache - use Upstash (external, already setup)
```

### Monthly Cost Estimate
```
If done correctly:
  CodePipeline + CodeBuild + CodeDeploy:  $0 (FREE)
  1x EC2 t2.micro:                        $0 (FREE tier)
  S3:                                     $0 (well under 5GB)
  CloudWatch:                             $0 (free tier)
  Data Transfer:                          $0 (minimal)
  ────────────────────────────────────────────
  TOTAL:                                  ~$0-5/month (if you mess up)
```

**Bottom line: This can be completely free for the 12-month assignment period.**

---

## 🏗️ Architecture: AWS Free Tier Blue-Green

### Simple Setup (Recommended for Assignment)

```
┌──────────────────────────────────────────────────────┐
│  AWS CodePipeline (FREE)                            │
│  ├─ Trigger: GitHub push to main                    │
│  ├─ Build: CodeBuild (builds Docker image)          │
│  ├─ Deploy: CodeDeploy (handles blue-green)         │
│  └─ Approval: Manual gate (optional)                │
└────────────────────┬─────────────────────────────────┘
                     │
            ┌────────┴────────┐
            ↓                 ↓
        AWS ECR          AWS Systems Manager
       (docker           (Config storage)
        image)                │
            │                 │
            └─────────┬───────┘
                      ↓
        ┌─────────────────────────────┐
        │  EC2 t2.micro (FREE TIER)  │
        │                             │
        │  ┌─────────────────────┐   │
        │  │ Container 1 (Blue)  │   │
        │  │ Port 3001           │   │
        │  └─────────────────────┘   │
        │                             │
        │  ┌─────────────────────┐   │
        │  │ Container 2 (Green) │   │
        │  │ Port 3002           │   │
        │  └─────────────────────┘   │
        │                             │
        │  Nginx (traffic switch)     │
        │  Port 80/443                │
        │                             │
        │  SystemD manager script     │
        │  Handles switching          │
        └─────────────────────────────┘
                      ↓
            CloudWatch Monitoring
            (error rates, health)
                      ↓
            SNS Notifications
            (deployment status)
```

### Key Design Decision: Single EC2 Instance
```
WHY single instance instead of ECS/EKS?
  • ECS: Requires Application Load Balancer (~$16/month) ❌
  • EKS: Requires multiple instances ❌
  • EC2 + Docker: FREE tier, manually managed ✅

How to handle blue-green on single instance?
  • Run 2 Docker containers on same EC2 (port 3001, 3002)
  • Nginx proxy switches traffic between them
  • CodeDeploy script handles the orchestration
```

---

## 📋 What AWS Services You're Using (and why they're free)

### CodePipeline (FREE)
```
What it does:
  - Listens for GitHub pushes
  - Triggers build automatically
  - Orchestrates deployment stages

Why free:
  - First pipeline is FREE (AWS marketing strategy)
  
Cost: $0/month
```

### CodeBuild (750 min/month FREE)
```
What it does:
  - Pulls code from GitHub
  - Builds Docker image
  - Pushes to ECR
  - Runs tests

Why free:
  - 750 minutes per month free tier
  - Each build: ~3-5 minutes
  - 750 min ÷ 5 min/build = ~150 builds/month (plenty!)
  
Cost: $0/month (for assignment)
```

### CodeDeploy (FREE)
```
What it does:
  - Deploys new container to EC2
  - Handles stop/start of old container
  - Switches traffic (blue→green)
  - Reports status

Why free:
  - CodeDeploy itself is FREE
  - You only pay for EC2 instances (which are already free tier)
  
Cost: $0/month
```

### EC2 t2.micro (FREE for 12 months)
```
What it does:
  - Runs Docker daemon
  - Runs 2 containers (blue & green)
  - Runs Nginx for traffic switching
  - Runs CloudWatch agent

Specs:
  - 1 vCPU
  - 1 GB RAM
  - 30 GB EBS storage

Why free:
  - AWS free tier includes 1x t2.micro/month
  - 750 hours/month = can run 24/7
  
Cost: $0/month (FREE tier)
Cost after 12 months: ~$10-12/month
```

### ECR (5 GB storage FREE)
```
What it does:
  - Stores Docker images
  - CodeBuild pushes images here
  - EC2 pulls from here

Why free:
  - 5 GB of storage per month
  - Each image: ~500MB compressed
  - So: ~10 images stored
  
Cost: $0/month
```

### CloudWatch (FREE)
```
What it does:
  - Logs from containers
  - Metrics (CPU, memory)
  - Health check monitoring

Why free:
  - 5 GB logs ingestion/month free
  - Dashboard queries free tier
  
Cost: $0/month
```

### S3 (5 GB FREE)
```
What it does:
  - Stores CodePipeline artifacts
  - Stores build logs
  - Stores deployment configs
  
Cost: ~$0/month
```

---

## 🚀 Deployment Flow (How Blue-Green Works)

### Initial State
```
EC2 Instance (t2.micro)
├─ Nginx proxy listening on port 80
│  └─ Currently routing to Green (port 3002)
├─ Green Container (v1.5)
│  ├─ Listening on port 3002
│  ├─ Serving live traffic
│  └─ DB: Neon PostgreSQL
└─ Blue Container (not running)
```

### Step 1: Developer Pushes Code
```
Developer: git push origin main
           ↓
GitHub: Webhook triggers CodePipeline
        ↓
CodePipeline: Stage 1 - Source (fetch from GitHub)
```

### Step 2: Build Stage
```
CodeBuild:
  ├─ Checks out code from GitHub
  ├─ Installs dependencies (pnpm install)
  ├─ Builds Next.js app (pnpm build)
  ├─ Creates Docker image
  │  └─ Tags: url-shortener:v1.6.0-20251022
  └─ Pushes to ECR
     └─ Image size: ~400-500 MB compressed

Time: ~4-5 minutes
Cost: ~0.4 CodeBuild minutes (negligible)
```

### Step 3: Deploy Stage (Blue-Green Switch)
```
CodeDeploy EC2 Agent:
  
  1️⃣ Pre-deployment checks
     ├─ Health check: GET /health on Green
     ├─ Verify Green is healthy
     └─ Backup Green container (tag as rollback candidate)
  
  2️⃣ Deploy new version to Blue
     ├─ Pull image from ECR: url-shortener:v1.6.0
     ├─ docker run -p 3001:3000 \
     │           -e DATABASE_URL=... \
     │           -e KV_REST_API_URL=... \
     │           url-shortener:v1.6.0
     └─ Wait for container startup (~30-60 sec)
  
  3️⃣ Health checks on Blue
     ├─ GET /health → expecting 200 OK
     ├─ Wait for readiness (up to 2 minutes)
     └─ Smoke tests: 5 sample requests
  
  4️⃣ If health checks pass:
     ├─ Nginx config reload (switch to port 3001)
     ├─ Wait 30 seconds (drain requests from Green)
     └─ Stop Green container
     
  5️⃣ If health checks fail:
     ├─ docker stop Blue (port 3001)
     ├─ Nginx keeps routing to Green (port 3002)
     ├─ Alert: "Deployment failed, rolled back"
     └─ Investigate logs
  
  6️⃣ Post-deployment
     ├─ Monitor Blue for 5 minutes
     ├─ Watch error rates in CloudWatch
     └─ If OK: Mark as success, prepare Green for next deployment
```

### Result
```
AFTER SUCCESSFUL DEPLOYMENT:

EC2 Instance (t2.micro)
├─ Nginx proxy listening on port 80
│  └─ NOW routing to Blue (port 3001) ← TRAFFIC SWITCHED
├─ Blue Container (v1.6.0) ← NEW VERSION
│  ├─ Listening on port 3001
│  ├─ Serving live traffic
│  └─ DB: Neon PostgreSQL
└─ Green Container (v1.5) ← STOPPED, ready for next cycle
   └─ Can be restarted as rollback candidate
```

### Rollback (If Needed)
```
Option 1: Instant rollback (manual)
  docker start Green (on port 3002)
  nginx reload (back to port 3002)
  Traffic back to v1.5 in <1 second

Option 2: Re-deploy last known good version
  CodePipeline → Redeploy from Git tag
  Blue gets old image
  Blue → traffic switch → rollback complete
```

---

## 📦 Configuration Files for AWS Free Tier

### File 1: buildspec.yml (CodeBuild config)
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Logging in to Amazon ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/url-shortener
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      
  build:
    commands:
      - echo "Building Docker image on `date`"
      - docker build -t $REPOSITORY_URI:$IMAGE_TAG .
      - docker tag $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:latest
      
  post_build:
    commands:
      - echo "Pushing Docker image to ECR..."
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - docker push $REPOSITORY_URI:latest
      - echo "Writing image definitions file..."
      - printf '[{"name":"url-shortener","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files: imagedefinitions.json
  
cache:
  paths:
    - 'node_modules/**/*'
```

### File 2: appspec.yaml (CodeDeploy config)
```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::EC2::Instance
      Properties:
        Name: url-shortener
        ProviderName: CodeDeploy

Hooks:
  ApplicationStart:
    - Location: scripts/start_server.sh
      Timeout: 300
      RunAs: root
  
  ApplicationStop:
    - Location: scripts/stop_server.sh
      Timeout: 60
      RunAs: root
  
  ValidateService:
    - Location: scripts/validate_service.sh
      Timeout: 300
      RunAs: root
  
  BeforeBlockTraffic:
    - Location: scripts/before_block_traffic.sh
      Timeout: 60
      RunAs: root
  
  AfterBlockTraffic:
    - Location: scripts/after_block_traffic.sh
      Timeout: 60
      RunAs: root
```

### File 3: Dockerfile (Optimized for AWS)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY public ./public

# Health check (required for CodeDeploy)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1))"

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
```

---

## 🛠️ AWS Setup Steps (Free Tier Safe)

### Step 1: Create AWS Free Tier Account
```bash
1. Go to aws.amazon.com/free
2. Create account
3. Enable 12-month free trial
4. Verify email & phone

⚠️ Set up billing alerts IMMEDIATELY:
  AWS Console → Billing
  → Set budget alarm at $5/month (safety net)
  → Enables notifications if you exceed
```

### Step 2: Setup IAM User (Security Best Practice)
```bash
# Never use root account for deployments!

AWS Console → IAM:
  1. Users → Create user: "codepipeline-user"
  2. Attach policies:
     - AmazonEC2ContainerRegistryFullAccess (ECR)
     - AmazonEC2FullAccess (for CodeDeploy)
     - AWSCodePipelineFullAccess
     - AWSCodeBuildAdminAccess
     - AWSCodeDeployRoleForEC2
  3. Create access key
  4. Save to secure location
```

### Step 3: Launch EC2 Instance
```bash
AWS Console → EC2 Dashboard:
  
  1. Launch Instances
  
  2. Name: "url-shortener-blue-green"
  
  3. AMI: Ubuntu Server 24.04 LTS (free tier eligible)
  
  4. Instance type: t2.micro ✅ (must be free tier!)
  
  5. Network settings:
     - VPC: default
     - Auto-assign public IP: Enable
     - Security group: Create new
       - Name: "url-shortener-sg"
       - Inbound rules:
         * SSH (22) from YOUR IP
         * HTTP (80) from 0.0.0.0/0
         * HTTPS (443) from 0.0.0.0/0
         * TCP 3001 from 0.0.0.0/0 (Blue)
         * TCP 3002 from 0.0.0.0/0 (Green)
  
  6. Storage: 30 GB (free tier allows 30GB)
  
  7. Advanced details:
     - IAM instance profile: CodeDeployEC2Role
     
  8. User data script (next step)
  
  9. Review and Launch
     ⚠️ Create key pair "url-shortener-key.pem"
     ⚠️ Download and save safely
```

### Step 4: EC2 User Data Script
```bash
# Paste this in "Advanced details" → User data

#!/bin/bash
set -e

# Update system
sudo apt-get update
sudo apt-get install -y curl wget

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install CodeDeploy agent
sudo apt-get install -y ruby wget

cd /home/ubuntu
wget https://aws-codedeploy-${AWS_REGION}.s3.${AWS_REGION}.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto

# Install Nginx (for traffic switching)
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx config for blue-green
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
upstream url_shortener {
    server localhost:3002; # Green by default
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    location / {
        proxy_pass http://url_shortener;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo systemctl reload nginx

echo "Setup complete!"
```

### Step 5: Create ECR Repository
```bash
AWS Console → ECR:
  
  1. Create repository
  2. Name: url-shortener
  3. Scan on push: Enable (catches vulnerabilities)
  4. Leave other defaults
  5. Create
  
# You'll get: ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/url-shortener
```

### Step 6: Create CodePipeline
```bash
AWS Console → CodePipeline:
  
  1. Create pipeline
  2. Name: url-shortener-pipeline
  3. Service role: Create new role (auto-setup)
  
  4. Source stage:
     - Provider: GitHub (v2)
     - Connect to GitHub (authorize)
     - Repository: anshthakur0999/url-shortener
     - Branch: main
     - Trigger: CodePipeline default (GitHub Push)
  
  5. Build stage:
     - Provider: AWS CodeBuild
     - Create project:
       * Project name: url-shortener-build
       * Environment: Managed image
       * OS: Ubuntu
       * Runtime: Standard
       * Image: aws/codebuild/standard:7.0
       * Service role: Create new
       * Buildspec: (use buildspec.yml from repo)
  
  6. Deploy stage:
     - Provider: AWS CodeDeploy
     - Create application:
       * Application name: url-shortener
       * Compute platform: EC2/On-premises
       * Create deployment group:
         - Name: url-shortener-deployment-group
         - Service role: Create CodeDeployRole
         - Deployment type: Blue/green ✅
         - Instances: Add tags
           * Key: Name
           * Value: url-shortener-blue-green
       * Deployment config: CodeDeployDefault.OneAtATime
       * Load balancer: None (we're using Nginx)
  
  7. Review and create
```

---

## 📊 Monitoring & Health Checks

### Add Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check database connection
    const dbOk = await checkDatabase()
    
    // Check Redis connection
    const redisOk = await checkRedis()
    
    if (dbOk && redisOk) {
      return NextResponse.json(
        { status: 'healthy', timestamp: new Date() },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { status: 'unhealthy', db: dbOk, redis: redisOk },
        { status: 503 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}

async function checkDatabase() {
  try {
    // Test Neon connection
    const result = await sql`SELECT 1`
    return result.length > 0
  } catch {
    return false
  }
}

async function checkRedis() {
  try {
    // Test Redis ping
    const result = await redis.ping()
    return result === 'PONG'
  } catch {
    return false
  }
}
```

### CloudWatch Monitoring
```bash
AWS Console → CloudWatch:

1. Create dashboard: "url-shortener-deployment"

2. Add widgets:
   ├─ EC2 CPU Utilization (alert if >80%)
   ├─ EC2 Memory Usage (via CloudWatch agent)
   ├─ Deployment status (CodeDeploy)
   ├─ HTTP 5xx errors (Application Insights)
   └─ Response time (application logs)

3. Create alarms:
   ├─ CPU > 80% for 5 min → SNS notification
   ├─ HTTP 5xx > 1% → SNS notification
   └─ CodeDeploy failure → SNS + email
```

---

## ✅ Assignment Checklist

### Before Deployment
```
Code Quality:
  ☐ All tests passing
  ☐ pnpm build successful
  ☐ .dockerignore created
  ☐ Health endpoint working locally

AWS Setup:
  ☐ Free tier account created
  ☐ Billing alert set to $5/month
  ☐ IAM user created for deployments
  ☐ EC2 instance running (t2.micro)
  ☐ Security group allows HTTP/HTTPS
  ☐ ECR repository created
  ☐ CodeDeploy agent running on EC2
  ☐ Nginx installed and configured

Configuration:
  ☐ buildspec.yml in repo root
  ☐ appspec.yaml in repo root
  ☐ deployment scripts in scripts/ folder
  ☐ Dockerfile optimized
  ☐ All AWS ARNs configured correctly
  ☐ GitHub personal access token created
```

### During Deployment
```
Monitoring:
  ☐ CodeBuild logs showing successful build
  ☐ Docker image pushed to ECR
  ☐ CodeDeploy showing progress
  ☐ Health checks passing on new container
  ☐ Traffic switched to new version
  ☐ No errors in CloudWatch logs
```

### Post-Deployment
```
Verification:
  ☐ App accessible via EC2 public IP
  ☐ URL shortening works
  ☐ Redirects work
  ☐ Analytics tracking
  ☐ No 5xx errors in logs
  ☐ CloudWatch metrics healthy
  
Testing Rollback:
  ☐ Manually trigger re-deployment from Git
  ☐ Verify blue-green switch works
  ☐ Test instant rollback (stop new, start old)
  ☐ Document rollback time (<1 second)
```

---

## 📝 Assignment Documentation

### What to Document
```
1. Architecture Diagram
   - Show EC2, Docker containers, Nginx, CodePipeline
   - Label Blue/Green, traffic flow
   - Include external services (Neon, Upstash)

2. Deployment Flow
   - Step-by-step with screenshots
   - Show each CodePipeline stage
   - Include timing for each stage

3. Blue-Green Process
   - Explain how traffic switches
   - Show health check validation
   - Demonstrate rollback capability

4. Cost Analysis
   - Show free tier breakdown
   - Explain why everything is free
   - What happens after 12 months

5. Monitoring & Alerts
   - CloudWatch dashboard screenshots
   - Show health checks in action
   - Document alert thresholds

6. Source Code
   - buildspec.yml
   - appspec.yaml
   - Dockerfile
   - Health check endpoint
   - Nginx configuration
```

### Sample Screenshots to Include
```
1. CodePipeline running (all stages green)
2. CodeBuild log showing successful build
3. CodeDeploy showing Blue deployment
4. EC2 instance health checks
5. CloudWatch logs showing requests
6. Nginx traffic switch
7. Health endpoint response (JSON)
8. Application working in browser
9. Cost calculator showing $0 charges
```

---

## 🎓 Learning Outcomes (For Assignment Submission)

### What You're Demonstrating
```
✅ Docker:
   - Created Dockerfile optimized for production
   - Built multi-stage image for smaller size
   - Configured health checks in Docker

✅ CI/CD Pipeline:
   - CodePipeline orchestration
   - CodeBuild automated builds
   - CodeDeploy deployment automation

✅ Blue-Green Deployment:
   - Two concurrent container versions
   - Automated health check validation
   - Traffic switch mechanism
   - Instant rollback capability

✅ AWS Services:
   - Free tier optimization
   - Security groups & IAM roles
   - ECR for container images
   - CloudWatch monitoring

✅ DevOps Best Practices:
   - Infrastructure as Code (buildspec, appspec)
   - Automated testing before deployment
   - Monitoring and alerting
   - Disaster recovery (rollback)
```

### Talking Points for Presentation
```
1. "We used AWS free tier to stay within budget"
   - Explain t2.micro EC2
   - 750 CodeBuild minutes
   - No Application Load Balancer cost

2. "Blue-Green deployment achieves zero downtime"
   - Show traffic switch happening
   - Demonstrate healthy vs unhealthy deployment
   - Show automatic rollback

3. "CodePipeline automates Jenkins functionality"
   - Explain webhook trigger
   - Show build stage
   - Show deployment stage

4. "We added health checks for reliability"
   - Explain /health endpoint
   - Show it validates DB & Redis
   - Show deployment waits for health

5. "Monitoring catches issues early"
   - Show CloudWatch dashboard
   - Explain alarm thresholds
   - Show historical data
```

---

## ⏰ Timeline for Implementation

### Week 1: Setup & Preparation
```
Day 1-2: AWS Setup
  ├─ Create free tier account
  ├─ Setup billing alerts
  └─ Create IAM user

Day 3: EC2 & Docker Setup
  ├─ Launch t2.micro EC2
  ├─ Install Docker
  ├─ Install CodeDeploy agent
  └─ Install Nginx

Day 4-5: Create Configuration Files
  ├─ Write Dockerfile
  ├─ Create buildspec.yml
  ├─ Create appspec.yaml
  └─ Create deployment scripts
  
Day 6-7: Local Testing
  ├─ Test Docker image locally
  ├─ Test health checks
  └─ Test Nginx configuration
```

### Week 2: AWS Pipeline & Testing
```
Day 1-2: AWS Services Setup
  ├─ Create ECR repository
  ├─ Create CodePipeline
  ├─ Create CodeBuild project
  └─ Create CodeDeploy application

Day 3-4: First Deployment
  ├─ Push code to GitHub
  ├─ Trigger pipeline
  ├─ Monitor build stage
  ├─ Monitor deploy stage
  └─ Verify app is running

Day 5-6: Testing & Refinement
  ├─ Test blue-green switching
  ├─ Test health checks
  ├─ Test rollback
  └─ Fix any issues

Day 7: Documentation
  ├─ Screenshot all stages
  ├─ Document architecture
  ├─ Create presentation
  └─ Write runbook
```

---

## 🆘 Troubleshooting

### "EC2 instance out of free tier?"
```
Check:
  ✅ Instance type is t2.micro (AWS Console → Instances)
  ✅ No additional Elastic IPs (each costs $)
  ✅ No extra Load Balancers
  ✅ Data transfer minimal
  
If overage detected:
  → Stop instance immediately
  → Check AWS Billing → Cost Explorer
  → Disable any paid services
```

### "CodeBuild builds are failing"
```
Check buildspec.yml:
  1. Docker login credentials correct
  2. ECR repository ARN correct
  3. Environment variables passed
  
View logs:
  CodeBuild → Build history → View logs
  (Check for Docker errors, auth issues)
```

### "Deployment stuck in CodeDeploy"
```
SSH into EC2:
  ssh -i url-shortener-key.pem ubuntu@<PUBLIC_IP>
  
Check CodeDeploy agent:
  sudo systemctl status codedeploy-agent
  
Check logs:
  cat /var/log/codedeploy-agent/codedeploy-agent.log
  docker logs $(docker ps -q --filter status=running)
```

### "Traffic not switching between Blue/Green"
```
Check Nginx configuration:
  sudo nginx -t (test syntax)
  sudo cat /etc/nginx/sites-enabled/default
  
Restart Nginx:
  sudo systemctl reload nginx
  
Check container ports:
  docker ps (verify port 3001 and 3002)
  curl localhost:3001 (test Blue)
  curl localhost:3002 (test Green)
```

---

## 💰 Cost Guardrails

### Maximum Possible Cost (If You Mess Up)
```
Worst case scenario:

Application Load Balancer:  $16.43/month ❌ (DON'T use this)
RDS db.t2.micro:           $15/month    ❌ (use Neon instead)
NAT Gateway:               $32+/month   ❌ (not needed)
Data transfer (100 GB):    $9/month     ❌ (unlikely)
────────────────────────────────────────────────
If all mistakes:           ~$70+/month  😱

But if you follow this guide:  $0-5/month ✅
```

### Monitoring Real Costs
```
AWS Console → Billing → Cost Explorer:

1. Set time period: Last 30 days
2. Granularity: Daily
3. Metrics: Unblended Cost
4. Group by: Service

What to watch:
  • EC2: Should show $0 (free tier)
  • CodeBuild: Should show $0 (750 min free)
  • CodeDeploy: Should show $0 (free)
  • Data Transfer: Watch this (can sneak up)
  • ECR: Should show ~$0.50 (storage)
```

### Budget Alert (SET THIS IMMEDIATELY)
```
AWS Console → Budgets:

1. Create budget
2. Budget name: "Assignment Free Tier"
3. Period: Monthly
4. Limit: $10 USD
5. Alerts:
   ✅ Notify at 50% ($5)
   ✅ Notify at 100% ($10)
6. Email recipients: your-email@domain.com

This ensures you don't accidentally incur charges!
```

---

## 🎯 Final Deliverables for Assignment

### Code Repository
```
url-shortener/
├── Dockerfile                    ← Production-ready
├── buildspec.yml                ← CodeBuild config
├── appspec.yaml                 ← CodeDeploy config
├── .dockerignore                ← Optimized build
├── scripts/
│   ├── start_server.sh           ← Blue-Green start
│   ├── stop_server.sh            ← Blue-Green stop
│   ├── validate_service.sh       ← Health checks
│   └── before_block_traffic.sh   ← Pre-switch checks
├── app/
│   ├── api/
│   │   ├── health/route.ts       ← Health endpoint
│   │   └── ...
│   └── ...
└── README.md                     ← Updated with AWS setup
```

### Documentation
```
1. DEPLOYMENT_STRATEGY.md
   ├─ Architecture diagram
   ├─ Blue-green flow explanation
   ├─ AWS services used
   └─ Cost breakdown

2. AWS_FREE_TIER_DEPLOYMENT.md (this file)
   ├─ Step-by-step setup
   ├─ Configuration files
   ├─ Monitoring setup
   └─ Troubleshooting

3. ASSIGNMENT_ROADMAP.md
   ├─ What was learned
   ├─ Screenshots of deployment
   ├─ Rollback demonstration
   └─ Future enhancements

4. Architecture Diagrams
   ├─ Pre-deployment state
   ├─ During deployment (Blue starts)
   ├─ Post-deployment (traffic switched)
   └─ Rollback scenario

5. Screenshots
   ├─ CodePipeline running
   ├─ CodeBuild successful build
   ├─ CodeDeploy deployment stages
   ├─ CloudWatch metrics
   ├─ Health endpoint response
   ├─ Application working
   └─ Cost showing $0
```

### Presentation Talking Points
```
1. Introduction (1 min)
   "We implemented Blue-Green deployment on AWS free tier"

2. Architecture (2 min)
   - Show diagram
   - Explain EC2, Docker, Nginx
   - Point out external services (Neon, Upstash)

3. Deployment Process (3 min)
   - Show CodePipeline
   - Explain each stage
   - Play back video of deployment

4. Blue-Green Mechanism (2 min)
   - Explain two containers
   - Show health checks
   - Demonstrate traffic switch

5. Monitoring & Safety (2 min)
   - Show CloudWatch dashboard
   - Explain alerts
   - Show rollback capability

6. Cost Analysis (1 min)
   - Show $0 charges
   - Explain free tier usage
   - Note 12-month limit

7. Conclusion (1 min)
   - Lessons learned
   - What this teaches about DevOps
   - Future improvements
```

---

## ✅ Before You Submit

### Final Verification Checklist
```
Code:
  ☐ All source files committed to Git
  ☐ Dockerfile builds successfully
  ☐ No hardcoded secrets in code
  ☐ Health endpoint implemented
  ☐ Application works locally

AWS:
  ☐ CodePipeline automated and working
  ☐ Deployments completing successfully
  ☐ Blue-Green switching verified
  ☐ Rollback tested and working
  ☐ CloudWatch monitoring in place
  ☐ Cost still under $5

Documentation:
  ☐ Architecture diagrams created
  ☐ Step-by-step setup documented
  ☐ Troubleshooting guide included
  ☐ Screenshots of all stages
  ☐ Talking points prepared

Presentation:
  ☐ Slide deck created
  ☐ Demo ready (or recorded video)
  ☐ Timing practiced (7-10 minutes)
  ☐ Questions anticipated
  ☐ Backup plan if live demo fails
```

### What the Professor Will Look For
```
✅ Understanding of Blue-Green deployment
   → Can you explain why traffic switches?
   → How does health checking work?

✅ AWS practical knowledge
   → Can you navigate CodePipeline, CodeDeploy?
   → Do you understand free tier constraints?

✅ DevOps practices
   → Infrastructure as Code (configs)
   → Automated testing before deployment
   → Monitoring and alerting

✅ Problem-solving
   → Troubleshot issues on your own
   → Debugged Docker/Nginx problems
   → Handled edge cases

✅ Cost consciousness
   → Kept project free tier
   → No unnecessary AWS services
   → Monitored spending
```

