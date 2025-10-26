# 🏗️ Blue-Green Deployment Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                         AWS EC2 Instance                                 │
│                      (t3.medium - Ubuntu 22.04)                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    K3s Kubernetes Cluster                          │ │
│  │                                                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │              Namespace: url-shortener                        │ │ │
│  │  │                                                              │ │ │
│  │  │  ┌─────────────────────┐      ┌─────────────────────┐      │ │ │
│  │  │  │  Blue Deployment    │      │  Green Deployment   │      │ │ │
│  │  │  │  ┌───────────────┐  │      │  ┌───────────────┐  │      │ │ │
│  │  │  │  │   Pod 1       │  │      │  │   Pod 1       │  │      │ │ │
│  │  │  │  │ url-shortener │  │      │  │ url-shortener │  │      │ │ │
│  │  │  │  │   v1.0.0      │  │      │  │   v1.1.0      │  │      │ │ │
│  │  │  │  └───────────────┘  │      │  └───────────────┘  │      │ │ │
│  │  │  │  ┌───────────────┐  │      │  ┌───────────────┐  │      │ │ │
│  │  │  │  │   Pod 2       │  │      │  │   Pod 2       │  │      │ │ │
│  │  │  │  │ url-shortener │  │      │  │ url-shortener │  │      │ │ │
│  │  │  │  │   v1.0.0      │  │      │  │   v1.1.0      │  │      │ │ │
│  │  │  │  └───────────────┘  │      │  └───────────────┘  │      │ │ │
│  │  │  └──────────┬──────────┘      └──────────┬──────────┘      │ │ │
│  │  │             │                            │                 │ │ │
│  │  │             │    ┌───────────────────┐   │                 │ │ │
│  │  │             └────►  Service (Blue)   │   │                 │ │ │
│  │  │                  │  ClusterIP        │   │                 │ │ │
│  │  │                  └───────────────────┘   │                 │ │ │
│  │  │                  ┌───────────────────┐   │                 │ │ │
│  │  │                  │  Service (Green)  ◄───┘                 │ │ │
│  │  │                  │  ClusterIP        │                     │ │ │
│  │  │                  └───────────────────┘                     │ │ │
│  │  │                           │                                │ │ │
│  │  │                  ┌────────▼──────────┐                     │ │ │
│  │  │                  │  Main Service     │                     │ │ │
│  │  │                  │  LoadBalancer/    │                     │ │ │
│  │  │                  │  NodePort         │                     │ │ │
│  │  │                  │  Selector:        │                     │ │ │
│  │  │                  │  version: blue ◄──┼─── Traffic Switch   │ │ │
│  │  │                  └────────┬──────────┘                     │ │ │
│  │  └───────────────────────────┼────────────────────────────────┘ │ │
│  │                              │                                  │ │
│  │                    ┌─────────▼──────────┐                       │ │
│  │                    │   Ingress/Traefik  │                       │ │
│  │                    │   (Port 80/443)    │                       │ │
│  │                    └─────────┬──────────┘                       │ │
│  └──────────────────────────────┼────────────────────────────────────┘ │
│                                 │                                      │
│  ┌──────────────────────────────▼────────────────────────────────────┐ │
│  │                         Jenkins Server                            │ │
│  │                         (Port 8080)                               │ │
│  │                                                                   │ │
│  │  Pipeline Stages:                                                │ │
│  │  1. Checkout Code from GitHub                                    │ │
│  │  2. Detect Active Environment (Blue/Green)                       │ │
│  │  3. Build Docker Image                                           │ │
│  │  4. Push to Docker Registry                                      │ │
│  │  5. Deploy to Inactive Environment                               │ │
│  │  6. Run Health Checks                                            │ │
│  │  7. Switch Traffic (Update Service Selector)                     │ │
│  │  8. Verify Deployment                                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Docker Registry (Port 5000)                    │  │
│  │                    Stores Container Images                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ External Connections
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌──────────────────┐    ┌──────────────────┐
│ Neon Database │      │ Upstash Redis    │    │ GitHub Repo      │
│ PostgreSQL    │      │ Cache            │    │ Source Code      │
│ (External)    │      │ (External)       │    │ (External)       │
└───────────────┘      └──────────────────┘    └──────────────────┘
```

---

## Deployment Flow Sequence

### Initial State (Blue is Active)

```
User Request → Ingress → Service (selector: blue) → Blue Pods (v1.0.0)
                                                      ✓ Serving Traffic
Green Pods (v1.0.0) → Idle
```

### During Deployment (New Version v1.1.0)

```
1. Jenkins detects code change
2. Builds Docker image (v1.1.0)
3. Pushes to registry
4. Deploys to Green environment
5. Green Pods start with v1.1.0

User Request → Ingress → Service (selector: blue) → Blue Pods (v1.0.0)
                                                      ✓ Still Serving Traffic
Green Pods (v1.1.0) → Starting/Health Checks
```

### After Health Checks Pass

```
6. Jenkins runs health checks on Green
7. All checks pass ✓
8. Jenkins updates Service selector to "green"

User Request → Ingress → Service (selector: green) → Green Pods (v1.1.0)
                                                       ✓ Now Serving Traffic
Blue Pods (v1.0.0) → Idle (Ready for Rollback)
```

### Rollback Scenario (If Needed)

```
Issue detected! → Rollback command
Service selector changed back to "blue"

User Request → Ingress → Service (selector: blue) → Blue Pods (v1.0.0)
                                                      ✓ Serving Traffic Again
Green Pods (v1.1.0) → Idle
```

---

## Component Details

### 1. EC2 Instance
- **Type**: t3.medium (2 vCPU, 4GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Cost**: ~$30/month
- **Ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8080 (Jenkins)

### 2. K3s Cluster
- **Type**: Lightweight Kubernetes
- **Components**:
  - API Server
  - Controller Manager
  - Scheduler
  - Kubelet
  - Traefik Ingress Controller (built-in)

### 3. Deployments
- **Blue Deployment**: 2 replicas of current version
- **Green Deployment**: 2 replicas of new version
- **Resources per Pod**:
  - Request: 250m CPU, 256Mi RAM
  - Limit: 500m CPU, 512Mi RAM

### 4. Services
- **Main Service**: Routes traffic based on selector
- **Blue Service**: Direct access to Blue pods
- **Green Service**: Direct access to Green pods

### 5. Jenkins
- **Purpose**: CI/CD automation
- **Plugins**: Docker Pipeline, Kubernetes CLI, Git
- **Access**: http://EC2-IP:8080

### 6. Docker Registry
- **Type**: Local registry
- **Port**: 5000
- **Purpose**: Store container images

---

## Traffic Flow

### Normal Request Flow

```
1. User → http://your-domain.com/abc123
2. DNS → EC2 Public IP
3. Ingress (Traefik) → Service
4. Service → Active Pod (Blue or Green)
5. Pod → Process Request
6. Pod → Query Neon Database
7. Pod → Check Upstash Redis Cache
8. Pod → Return Response
9. Response → User
```

### Blue-Green Switch

```
Before Switch:
Service.spec.selector.version = "blue"
Traffic → Blue Pods

Switch Command:
kubectl patch service url-shortener-service \
  -p '{"spec":{"selector":{"version":"green"}}}'

After Switch:
Service.spec.selector.version = "green"
Traffic → Green Pods

Rollback (if needed):
kubectl patch service url-shortener-service \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

---

## Data Flow

### Application Data
```
User Request
    ↓
Next.js App (Pod)
    ↓
┌───────────────┐
│ Check Redis   │ → Cache Hit → Return Cached Data
│ Cache         │
└───────┬───────┘
        │ Cache Miss
        ↓
┌───────────────┐
│ Query Neon DB │ → Fetch Data
└───────┬───────┘
        │
        ↓
┌───────────────┐
│ Update Redis  │ → Cache for Future
└───────┬───────┘
        │
        ↓
    Return to User
```

### Deployment Data
```
GitHub Push
    ↓
Jenkins Webhook
    ↓
Build Docker Image
    ↓
Push to Registry
    ↓
Pull Image to Pod
    ↓
Start Container
    ↓
Load Environment Variables (from Secrets/ConfigMap)
    ↓
Connect to Neon DB & Upstash Redis
    ↓
Ready to Serve Traffic
```

---

## High Availability

### Current Setup
- **Pods**: 2 replicas per environment (4 total)
- **Availability**: If 1 pod fails, traffic routes to healthy pod
- **Rollback**: Instant switch to previous version

### Scaling Options
```bash
# Scale up for high traffic
kubectl scale deployment url-shortener-blue -n url-shortener --replicas=5

# Scale down to save resources
kubectl scale deployment url-shortener-green -n url-shortener --replicas=1
```

---

## Security Layers

```
1. AWS Security Group
   ↓ (Firewall Rules)
2. Kubernetes Network Policies
   ↓ (Pod-to-Pod Communication)
3. Kubernetes Secrets
   ↓ (Encrypted Environment Variables)
4. Application Layer
   ↓ (Input Validation, etc.)
5. External Services (Neon/Upstash)
   ↓ (SSL/TLS Connections)
```

---

## Monitoring Points

### What to Monitor
1. **Pod Health**: `kubectl get pods -n url-shortener`
2. **Service Status**: `kubectl get svc -n url-shortener`
3. **Resource Usage**: `kubectl top pods -n url-shortener`
4. **Logs**: `kubectl logs -n url-shortener -l app=url-shortener`
5. **Events**: `kubectl get events -n url-shortener`

### Key Metrics
- Pod CPU/Memory usage
- Request latency
- Error rates
- Active connections
- Database query performance

---

## Cost Optimization Strategy

### Current Costs (~$35/month)
```
EC2 t3.medium:     $30.00
EBS 30GB:          $ 3.00
Data Transfer:     $ 2.00
─────────────────────────
Total:             $35.00
```

### Optimized Costs (~$15/month)
```
EC2 t3.small:      $15.00  (50% savings)
EBS 20GB:          $ 2.00
Data Transfer:     $ 1.00
─────────────────────────
Total:             $18.00
```

### Free Tier (First 12 months)
```
EC2 t2.micro:      $ 0.00  (750 hrs/month free)
EBS 30GB:          $ 0.00  (30GB free)
Data Transfer:     $ 0.00  (15GB free)
─────────────────────────
Total:             $ 0.00
```

---

This architecture provides a production-ready, cost-effective Blue-Green deployment solution! 🚀

