# 📁 File Structure After Implementation

## Your Repository Structure (After Adding All Files)

```
url-shortener/
├── 📄 Dockerfile                    ← ADD THIS (Docker image config)
├── 📄 buildspec.yml                 ← ADD THIS (CodeBuild config)
├── 📄 appspec.yaml                  ← ADD THIS (CodeDeploy config)
├── 📄 .dockerignore                 ← ADD THIS (Docker build optimization)
│
├── 📁 scripts/                       ← CREATE THIS FOLDER
│   ├── 📄 start_server.sh            ← ADD THIS (deploy Blue container)
│   ├── 📄 stop_server.sh             ← ADD THIS (stop Green container)
│   ├── 📄 validate_service.sh        ← ADD THIS (health check)
│   └── 📄 before_block_traffic.sh    ← ADD THIS (switch traffic)
│
├── 📁 app/
│   ├── 📁 api/
│   │   ├── 📁 health/
│   │   │   └── 📄 route.ts           ← ADD THIS (health endpoint)
│   │   ├── shorten/
│   │   │   └── route.ts
│   │   ├── track/
│   │   │   └── route.ts
│   │   └── ...
│   ├── 📁 [shortCode]/
│   │   └── page.tsx
│   ├── 📁 analytics/
│   │   └── ...
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── 📁 components/
│   └── ...
│
├── 📁 lib/
│   └── ...
│
├── 📁 public/
│   └── ...
│
├── 📄 package.json
├── 📄 pnpm-lock.yaml
├── 📄 tsconfig.json
├── 📄 next.config.mjs
├── 📄 postcss.config.mjs
├── 📄 components.json
│
└── 📚 DOCUMENTATION FILES CREATED:
    ├── 📄 QUICK_START.md                    ← Start here
    ├── 📄 FREE_TIER_DEPLOYMENT_GUIDE.md     ← Main implementation guide
    ├── 📄 ASSIGNMENT_ROADMAP.md             ← Detailed reference
    ├── 📄 DEPLOYMENT_STRATEGY.md            ← Context & options
    ├── 📄 DEPLOYMENT_DECISION_GUIDE.md      ← Why we chose this approach
    ├── 📄 DEPLOYMENT_OPTIONS_SUMMARY.md     ← Comparison matrices
    └── 📄 DEPLOYMENT_DECISION_VISUAL.md     ← Visual decision trees
```

---

## 🎯 What YOU Need to Create (11 Files)

### ✅ Configuration Files (4 files in root)

**1. Dockerfile**
```
Location: url-shortener/Dockerfile
Size: ~300 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
```

**2. buildspec.yml**
```
Location: url-shortener/buildspec.yml
Size: ~40 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
```

**3. appspec.yaml**
```
Location: url-shortener/appspec.yaml
Size: ~30 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
```

**4. .dockerignore**
```
Location: url-shortener/.dockerignore
Size: ~15 lines
Content:
  node_modules
  npm-debug.log
  .next
  .git
  .gitignore
  README.md
  .env
  .env.local
```

### ✅ Shell Scripts (4 files in scripts/ folder)

**5. scripts/start_server.sh**
```
Location: url-shortener/scripts/start_server.sh
Size: ~20 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
Permissions: chmod +x start_server.sh
```

**6. scripts/stop_server.sh**
```
Location: url-shortener/scripts/stop_server.sh
Size: ~5 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
Permissions: chmod +x stop_server.sh
```

**7. scripts/validate_service.sh**
```
Location: url-shortener/scripts/validate_service.sh
Size: ~8 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
Permissions: chmod +x validate_service.sh
```

**8. scripts/before_block_traffic.sh**
```
Location: url-shortener/scripts/before_block_traffic.sh
Size: ~5 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
Permissions: chmod +x before_block_traffic.sh
```

### ✅ Application Code (1 file in app/)

**9. app/api/health/route.ts**
```
Location: url-shortener/app/api/health/route.ts
Size: ~20 lines
Content: Copy from FREE_TIER_DEPLOYMENT_GUIDE.md section "Core Files"
Purpose: Health check endpoint for deployments
```

### ✅ Modify Existing Files (2 files)

**10. Update: README.md**
```
Location: url-shortener/README.md
Add section: "## 🚀 AWS Blue-Green Deployment"
Content: Quick reference to deployment guides
```

**11. Update: package.json** (if needed)
```
Usually no changes needed!
Check if all dependencies present:
  - next 15
  - react 19
  - @neondatabase/serverless
  - @upstash/redis
```

---

## 📊 Total Files to Add/Modify

```
New Files to Create:    9
  - Dockerfile
  - buildspec.yml
  - appspec.yaml
  - .dockerignore
  - scripts/start_server.sh
  - scripts/stop_server.sh
  - scripts/validate_service.sh
  - scripts/before_block_traffic.sh
  - app/api/health/route.ts

Existing Files to Update: 2
  - README.md (add deployment section)
  - OPTIONAL: next.config.mjs (add health check endpoint)

Lines of Code to Write: ~400-500 lines total
Time to Create: ~1-2 hours (mostly copy-paste)
Complexity: Easy (all provided in guides)
```

---

## 🔍 File-by-File Creation Checklist

### Preparation
- [ ] Read QUICK_START.md (5 min)
- [ ] Read FREE_TIER_DEPLOYMENT_GUIDE.md (20 min)
- [ ] Understand overall architecture

### Create Configuration Files
- [ ] Create `Dockerfile` in root
  - [ ] Verify build stage looks correct
  - [ ] Verify production stage looks correct
  - [ ] Check HEALTHCHECK command included
  
- [ ] Create `buildspec.yml` in root
  - [ ] Verify phases (pre_build, build, post_build)
  - [ ] Check ECR login command
  - [ ] Check Docker build command
  
- [ ] Create `appspec.yaml` in root
  - [ ] Verify all hook locations exist
  - [ ] Check timeout values
  - [ ] Verify running as root
  
- [ ] Create `.dockerignore` in root
  - [ ] Include node_modules
  - [ ] Include .next
  - [ ] Include .git

### Create Shell Scripts
- [ ] Create `scripts/` folder
  - [ ] Create `start_server.sh`
    - [ ] Make executable: `chmod +x`
    - [ ] Verify Docker run command
    - [ ] Verify port 3001
  
  - [ ] Create `stop_server.sh`
    - [ ] Make executable: `chmod +x`
    - [ ] Verify docker rename command
  
  - [ ] Create `validate_service.sh`
    - [ ] Make executable: `chmod +x`
    - [ ] Verify health check URL
  
  - [ ] Create `before_block_traffic.sh`
    - [ ] Make executable: `chmod +x`
    - [ ] Verify nginx sed command

### Create Application Code
- [ ] Create `app/api/health/` folder
  - [ ] Create `route.ts`
    - [ ] Import NextResponse
    - [ ] Export GET function
    - [ ] Return 200 on success
    - [ ] Return 503 on failure

### Update Documentation
- [ ] Update `README.md`
  - [ ] Add AWS deployment section
  - [ ] Link to guides
  
- [ ] Verify `package.json` has all dependencies
  - [ ] next 15
  - [ ] react 19
  - [ ] typescript
  - [ ] tailwindcss
  - [ ] @neondatabase/serverless
  - [ ] @upstash/redis

### Git Commit
- [ ] `git add .`
- [ ] `git commit -m "Add AWS blue-green deployment configuration"`
- [ ] `git push origin main`

---

## 🧪 Testing Your Files

### Test Docker Build Locally
```bash
# Build Docker image
docker build -t url-shortener:test .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  url-shortener:test

# Test health endpoint
curl http://localhost:3000/health
# Should return: {"status":"ok"}

# Test app loads
curl http://localhost:3000
# Should return: HTML content

# Stop container
docker stop <container_id>
```

### Test Scripts Locally
```bash
# Give execute permissions
chmod +x scripts/*.sh

# Test scripts syntax (no execution needed yet)
bash -n scripts/start_server.sh
bash -n scripts/stop_server.sh
bash -n scripts/validate_service.sh
bash -n scripts/before_block_traffic.sh
# Should output nothing if no syntax errors
```

---

## 📝 File Content Sizes

| File | Type | Size | Source |
|------|------|------|--------|
| Dockerfile | Docker | ~50 KB (text) | FREE_TIER_DEPLOYMENT_GUIDE.md |
| buildspec.yml | YAML | ~2 KB | FREE_TIER_DEPLOYMENT_GUIDE.md |
| appspec.yaml | YAML | ~1 KB | FREE_TIER_DEPLOYMENT_GUIDE.md |
| .dockerignore | Text | ~500 B | This guide |
| start_server.sh | Bash | ~1 KB | FREE_TIER_DEPLOYMENT_GUIDE.md |
| stop_server.sh | Bash | ~500 B | FREE_TIER_DEPLOYMENT_GUIDE.md |
| validate_service.sh | Bash | ~500 B | FREE_TIER_DEPLOYMENT_GUIDE.md |
| before_block_traffic.sh | Bash | ~500 B | FREE_TIER_DEPLOYMENT_GUIDE.md |
| app/api/health/route.ts | TypeScript | ~1 KB | FREE_TIER_DEPLOYMENT_GUIDE.md |
| **Total** | **-** | **~60 KB** | **-** |

---

## ⚡ Copy-Paste Quick Links

### Where to Find Each File Content
```
🔗 Dockerfile
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 1: Dockerfile"

🔗 buildspec.yml
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 2: buildspec.yml"

🔗 appspec.yaml
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 3: appspec.yaml"

🔗 start_server.sh
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 5: start_server.sh"

🔗 stop_server.sh
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 6: stop_server.sh"

🔗 validate_service.sh
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 7: validate_service.sh"

🔗 before_block_traffic.sh
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 8: before_block_traffic.sh"

🔗 app/api/health/route.ts
   → FREE_TIER_DEPLOYMENT_GUIDE.md → "File 4: Health Endpoint"

🔗 .dockerignore
   → This file (above)
```

---

## 🎯 Implementation Order (Recommended)

### Step 1: Root Configuration (15 min)
1. Create Dockerfile
2. Create buildspec.yml
3. Create appspec.yaml
4. Create .dockerignore
5. Test with `docker build`

### Step 2: Scripts (10 min)
1. Create scripts/ folder
2. Add all 4 shell scripts
3. Make them executable
4. Verify syntax with `bash -n`

### Step 3: Application Code (5 min)
1. Create app/api/health/ folder
2. Add route.ts
3. Test with `npm run dev`

### Step 4: Git & Commit (5 min)
1. `git add .`
2. `git commit -m "Add deployment config"`
3. `git push origin main`

### Step 5: AWS Setup (Next)
1. Follow steps in FREE_TIER_DEPLOYMENT_GUIDE.md
2. Configure CodePipeline
3. Watch first deployment

---

## ✅ Verification Checklist

Before pushing to GitHub:

```
Files Created:
  ☐ Dockerfile exists and is readable
  ☐ buildspec.yml exists and is valid YAML
  ☐ appspec.yaml exists and is valid YAML
  ☐ .dockerignore created
  ☐ scripts/ folder created
  ☐ All 4 shell scripts created in scripts/
  ☐ app/api/health/route.ts created

Permissions:
  ☐ All .sh files have execute permissions (chmod +x)

Content Verification:
  ☐ Dockerfile has multi-stage build
  ☐ Dockerfile has HEALTHCHECK
  ☐ buildspec.yml has all three phases
  ☐ appspec.yaml has all hooks
  ☐ route.ts imports NextResponse
  ☐ Scripts have proper error handling (set -e)

Git:
  ☐ Files in correct folders
  ☐ No secrets in any file
  ☐ No environment variables hardcoded
  ☐ Ready to commit and push
```

---

## 🚀 After Files Are Created

1. **Push to GitHub**: `git push origin main`
2. **AWS Setup**: Follow FREE_TIER_DEPLOYMENT_GUIDE.md
3. **First Deployment**: CodePipeline will trigger automatically
4. **Test**: Verify app runs on EC2
5. **Document**: Screenshot the success

---

## 📞 If You Get Stuck

| Problem | Solution |
|---------|----------|
| Docker build fails | Check Dockerfile syntax, verify Node.js version |
| CodeBuild fails | Check buildspec.yml, verify ECR permissions |
| CodeDeploy fails | Check appspec.yaml, verify scripts exist and are executable |
| Health check times out | Verify health endpoint added, app responding on 3001 |
| Traffic not switching | Verify before_block_traffic.sh runs, check Nginx config |
| Cost overages | Check EC2 instance type is t2.micro, no Load Balancer |

**Reference**: ASSIGNMENT_ROADMAP.md → "Troubleshooting" section

