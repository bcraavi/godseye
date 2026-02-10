---
sidebar_position: 3
title: Operations AI Agents
sidebar_label: "⚡ Operations AI Agents"
---

# ⚡ Operations AI Agents

Six autonomous agents that keep GodsEye running 24/7 across all clouds, all channels, all stores. Five central agents handle platform-wide operations, plus a fleet of **Project Sentinel Agents** -- one per cloud project -- that patrol individual projects 24/7 with day/night duty cycles.

---

## Agent Overview

| # | Agent | Trust Level | Scope | Key Metric |
|---|-------|-------------|-------|------------|
| 1 | SRE Agent | L2 AUTO-FIX | All 5 layers -- web, mobile, POS, payments, infra | MTTR < 2 min for known patterns |
| 2 | Deployment Agent | L2 AUTO-FIX | CI/CD pipelines, canary promotion, deploy freezes | Zero failed deploys reaching 100% traffic |
| 3 | Security Agent | L2 AUTO-FIX | PCI-DSS, credential rotation, supply chain, exfiltration | 0 unpatched critical CVEs > 24h |
| 4 | Data Agent | L1 SUGGEST | Pipeline health, schema drift, PII, query performance | < 5 min data freshness SLA |
| 5 | Cost Agent | L1 SUGGEST | Multi-cloud spend, right-sizing, reserved/spot, egress | 30% YoY cost reduction target |
| 6 | Project Sentinel Fleet | L0→L3 PHASED | Per-project health, security, cost, data -- day/night cycles | 100% project coverage, health score > 90 |

---

## All 6 Agents -- Interaction Topology

```mermaid
graph TD
    subgraph Ops["Operations AI Family"]
        SRE[SRE Agent]
        DEPLOY[Deployment Agent]
        SEC[Security Agent]
        DATA[Data Agent]
        COST[Cost Agent]
    end

    subgraph Sentinels["Project Sentinel Fleet (100-200)"]
        S1["Sentinel\npayments-prod"]
        S2["Sentinel\ncatalog-api"]
        SN["Sentinel\n...N projects"]
    end

    KG[(Knowledge Graph)]
    ALERT[Alert Router]
    SLACK[Slack / PagerDuty]

    subgraph External["External Systems"]
        K8S[Kubernetes Clusters]
        CI[CI/CD Pipelines]
        VAULT[HashiCorp Vault]
        PIPE[Data Pipelines]
        CLOUD[Cloud APIs<br/>AWS / GCP / Azure]
    end

    SRE -->|incident data| KG
    DEPLOY -->|deploy history| KG
    SEC -->|threat intel| KG
    DATA -->|pipeline status| KG
    COST -->|spend data| KG

    KG -.->|context| SRE
    KG -.->|context| DEPLOY
    KG -.->|context| SEC
    KG -.->|context| DATA
    KG -.->|context| COST

    SRE <-->|rollback requests| DEPLOY
    SRE <-->|credential issues| SEC
    SRE <-->|pipeline failures| DATA
    DEPLOY -->|cost impact check| COST
    DEPLOY -->|security review| SEC
    SEC -->|anomalous queries| DATA
    COST -->|right-sizing actions| SRE
    DATA -->|schema changes| DEPLOY

    S1 -->|escalate incidents| SRE
    S1 -->|security findings| SEC
    S1 -->|cost anomalies| COST
    S2 -->|pipeline issues| DATA
    S2 -->|deploy health| DEPLOY
    SN -.->|A2A protocol| S1
    SN -.->|A2A protocol| S2

    SRE --> K8S
    DEPLOY --> CI
    SEC --> VAULT
    DATA --> PIPE
    COST --> CLOUD

    SRE --> ALERT
    SEC --> ALERT
    ALERT --> SLACK

    style Ops fill:#2d3436,color:#fff
    style External fill:#1a1a2e,color:#fff
```

---

## 1. SRE Agent

Monitors all 5 layers continuously. Correlates alerts across web, mobile, POS, payments, and infrastructure. Auto-remediates known failure patterns in seconds. Creates PRs for code-level fixes. Generates postmortems automatically.

### Monitored Layers

| Layer | Signals | Example Alerts |
|-------|---------|----------------|
| Web | Core Web Vitals, JS error rate, API latency | LCP > 2.5s, error rate > 1% |
| Mobile | Crash rate, ANR, API timeout | Crash rate > 0.5%, ANR > 0.2% |
| POS | Terminal heartbeat, transaction latency, offline duration | Terminal offline > 30s, txn > 5s |
| Payments | Gateway response time, auth rate, decline rate | Auth rate < 95%, decline spike > 3x |
| Infrastructure | CPU, memory, disk, network, pod health, DB connections | CPU > 80% sustained, OOM kills |

### Auto-Remediation Decision Flow

```mermaid
flowchart TD
    ALERT[Alert Received] --> CLASSIFY{Classify Failure Pattern}

    CLASSIFY -->|DB Connection Pool Exhaustion| DB_FIX["Expand Connection Pool<br/>Scale read replicas<br/>Kill idle connections"]
    CLASSIFY -->|Memory Leak Detected| MEM_FIX["Graceful Restart with Drain<br/>Shift traffic to healthy pods<br/>Capture heap dump for analysis"]
    CLASSIFY -->|Failed Deployment| ROLL_FIX["Rollback in < 60s<br/>Restore previous artifact<br/>Notify deploy author"]
    CLASSIFY -->|Certificate Expiry < 30d| CERT_FIX["Auto-Renew Certificate<br/>Update secret store<br/>Rolling restart affected pods"]
    CLASSIFY -->|Cloud Region Degradation| REGION_FIX["Shift Traffic to Healthy Regions<br/>Update DNS weights<br/>Scale up target regions"]
    CLASSIFY -->|POS Terminal Offline| POS_FIX["Activate Store-and-Forward Mode<br/>Queue transactions locally<br/>Alert store manager"]
    CLASSIFY -->|Payment Gateway Down| PAY_FIX["Route to Secondary Gateway<br/>Enable fallback processor<br/>Monitor auth rate recovery"]
    CLASSIFY -->|Cache Stampede| CACHE_FIX["Circuit Breaker Activation<br/>Warm cache from replica<br/>Staggered TTL reset"]
    CLASSIFY -->|Unknown Pattern| ESCALATE["Escalate to On-Call<br/>Gather diagnostics<br/>Draft suggested remediation"]

    DB_FIX --> VERIFY{Metrics Recovered?}
    MEM_FIX --> VERIFY
    ROLL_FIX --> VERIFY
    CERT_FIX --> VERIFY
    REGION_FIX --> VERIFY
    POS_FIX --> VERIFY
    PAY_FIX --> VERIFY
    CACHE_FIX --> VERIFY

    VERIFY -->|YES| RESOLVED["Mark Resolved<br/>Update Knowledge Graph<br/>Generate Postmortem"]
    VERIFY -->|NO| ESCALATE

    ESCALATE --> HUMAN["Human On-Call Engaged"]
    HUMAN --> CODE_FIX{"Code-Level Fix Needed?"}
    CODE_FIX -->|YES| PR["SRE Agent Creates PR<br/>(N+1 query fix, connection pool config,<br/>retry logic, timeout tuning)"]
    CODE_FIX -->|NO| MANUAL["Manual Remediation"]

    PR --> RESOLVED
    MANUAL --> RESOLVED

    style ESCALATE fill:#e74c3c,color:#fff
    style RESOLVED fill:#27ae60,color:#fff
```

### Known Auto-Remediation Patterns

| Pattern | Detection Signal | Action | Time to Remediate |
|---------|-----------------|--------|-------------------|
| DB connection pool exhaustion | Active connections > 90% pool size | Expand pool, scale read replicas, kill idle | < 15s |
| Memory leak | RSS growth > 5% per hour, no plateau | Graceful restart with connection drain | < 30s |
| Failed deployment | Error rate spike within 5 min of deploy | Rollback to last known good artifact | < 60s |
| Certificate expiry | Days to expiry < 30 | Auto-renew via ACME, update Vault, rolling restart | < 5 min |
| Cloud region degradation | Health check failures > 3 consecutive | Shift traffic via DNS weight update | < 30s |
| POS terminal offline | Heartbeat missed > 30s | Activate store-and-forward queue | < 5s |
| Payment gateway down | Auth rate drops below 90% | Route to secondary processor | < 10s |
| Cache stampede | Cache miss rate > 50x baseline | Circuit breaker, warm from replica, stagger TTL | < 10s |

---

## 2. Deployment Agent

Reviews every PR for operational risk before merge. Manages canary promotion with live metric watching. Enforces deploy freezes around business events. Validates infrastructure changes against cost and security baselines. Detects configuration drift and auto-reconciles.

### Canary Promotion Workflow

```mermaid
flowchart TD
    PR[PR Merged to Main] --> BUILD["Build Artifact<br/>Run Tests<br/>Security Scan"]
    BUILD --> FREEZE_CHECK{"Deploy Freeze<br/>Active?"}

    FREEZE_CHECK -->|"YES<br/>(Black Friday week,<br/>flash sale window)"| QUEUE["Queue Deploy<br/>Notify Author<br/>Schedule for post-freeze"]
    FREEZE_CHECK -->|NO| RISK_CHECK{"Operational Risk<br/>Assessment"}

    RISK_CHECK -->|HIGH| MANUAL_APPROVE["Require Manual Approval<br/>Flag: DB migration, config change,<br/>dependency update, >500 LOC"]
    RISK_CHECK -->|LOW-MEDIUM| CANARY["Deploy Canary<br/>5% traffic"]

    MANUAL_APPROVE -->|Approved| CANARY
    MANUAL_APPROVE -->|Rejected| STOP["Deploy Blocked<br/>Notify Author"]

    CANARY --> WATCH_5["Watch 5 min<br/>Error rate, latency P99,<br/>CPU, memory, business metrics"]

    WATCH_5 --> CANARY_OK_5{Metrics Healthy?}
    CANARY_OK_5 -->|NO| ROLLBACK["Immediate Rollback<br/>Restore previous version<br/>Notify Author + On-Call"]
    CANARY_OK_5 -->|YES| PROMOTE_25["Promote to 25%"]

    PROMOTE_25 --> WATCH_25["Watch 10 min<br/>Same metrics + downstream deps"]
    WATCH_25 --> CANARY_OK_25{Metrics Healthy?}
    CANARY_OK_25 -->|NO| ROLLBACK
    CANARY_OK_25 -->|YES| PROMOTE_50["Promote to 50%"]

    PROMOTE_50 --> WATCH_50["Watch 15 min<br/>Full metric suite + SLA validation"]
    WATCH_50 --> CANARY_OK_50{Metrics Healthy?}
    CANARY_OK_50 -->|NO| ROLLBACK
    CANARY_OK_50 -->|YES| PROMOTE_100["Promote to 100%<br/>Mark Deploy Successful"]

    PROMOTE_100 --> KG_UPDATE["Update Knowledge Graph<br/>Deploy record, risk score,<br/>duration, rollback: false"]

    ROLLBACK --> KG_FAIL["Update Knowledge Graph<br/>Deploy failed, metrics snapshot,<br/>rollback: true, author notified"]

    style ROLLBACK fill:#e74c3c,color:#fff
    style PROMOTE_100 fill:#27ae60,color:#fff
    style QUEUE fill:#f39c12,color:#000
```

### Deploy Freeze Calendar

| Event | Freeze Window | Scope | Override Policy |
|-------|--------------|-------|-----------------|
| Black Friday / Cyber Monday | Full week (Mon-Mon) | All services | VP Engineering approval only |
| Flash sale | 2 hours before through 1 hour after | Commerce, payments, inventory | No overrides |
| End-of-month close | Last 2 days of month | Finance, reporting, data pipelines | Finance director approval |
| Peak hours (11am-2pm, 6pm-9pm) | Daily recurring | Tier 1 services only | SRE lead approval |
| PCI audit window | Duration of audit | Payment services | Security team approval |

### Drift Detection and Reconciliation

| Drift Type | Detection Method | Reconciliation Action |
|------------|-----------------|----------------------|
| Terraform state drift | Hourly `terraform plan` comparison | Auto-apply if safe, alert if destructive |
| K8s config drift | ArgoCD sync status monitoring | Auto-sync from Git source of truth |
| Feature flag drift | Flag state vs. expected per environment | Reconcile to environment-defined state |
| Secret rotation drift | Vault lease expiry tracking | Auto-rotate and rolling restart |
| DNS record drift | Cross-cloud DNS consistency check | Reconcile to primary DNS source |

---

## 3. Security Agent

Continuous PCI-DSS compliance monitoring across all environments. Detects anomalous access patterns in real time. Auto-rotates credentials on schedule and on compromise detection. Scans every PR for vulnerabilities. Monitors the full supply chain dependency tree. Detects data exfiltration attempts.

### Threat Detection and Response Flow

```mermaid
flowchart TD
    subgraph Sources["Detection Sources"]
        WAF[WAF Logs]
        AUTH[Auth Logs]
        NET[Network Flow Logs]
        PR_SCAN[PR Security Scan]
        DEP_SCAN[Dependency Scan]
        RUNTIME[Runtime Behavior]
    end

    WAF --> CORRELATE["Threat Correlation Engine"]
    AUTH --> CORRELATE
    NET --> CORRELATE
    PR_SCAN --> CORRELATE
    DEP_SCAN --> CORRELATE
    RUNTIME --> CORRELATE

    CORRELATE --> CLASSIFY{Threat Classification}

    CLASSIFY -->|Anomalous Access| ACCESS["Unusual login pattern<br/>Impossible travel<br/>Privilege escalation"]
    CLASSIFY -->|Vulnerability Found| VULN["CVE in dependency<br/>Code vulnerability<br/>Misconfiguration"]
    CLASSIFY -->|Data Exfiltration| EXFIL["Unusual data volume<br/>Unauthorized export<br/>PII in logs"]
    CLASSIFY -->|PCI-DSS Violation| PCI["Unencrypted cardholder data<br/>Missing audit log<br/>Access control gap"]
    CLASSIFY -->|Supply Chain Threat| SUPPLY["Compromised dependency<br/>Typosquat package<br/>Malicious update"]

    ACCESS --> BLOCK["Block Access<br/>Revoke Sessions<br/>Force MFA Re-auth"]
    VULN --> PATCH["Auto-Patch if Available<br/>Block Deploy if Critical<br/>Create Remediation PR"]
    EXFIL --> ISOLATE["Isolate Service<br/>Block Egress<br/>Preserve Forensics"]
    PCI --> REMEDIATE["Auto-Remediate Config<br/>Enable Missing Controls<br/>Alert Compliance Team"]
    SUPPLY --> LOCKDOWN["Pin Dependency Version<br/>Block Compromised Package<br/>Scan All Environments"]

    BLOCK --> REPORT["Security Incident Report<br/>Update Knowledge Graph<br/>Notify Security Team"]
    PATCH --> REPORT
    ISOLATE --> REPORT
    REMEDIATE --> REPORT
    LOCKDOWN --> REPORT

    REPORT --> ROTATE{"Credentials<br/>Compromised?"}
    ROTATE -->|YES| CRED_ROTATE["Auto-Rotate All Affected<br/>API keys, DB passwords,<br/>service tokens via Vault"]
    ROTATE -->|NO| CLOSE["Close Incident<br/>Update Threat Intel"]

    CRED_ROTATE --> CLOSE

    style ISOLATE fill:#e74c3c,color:#fff
    style BLOCK fill:#e74c3c,color:#fff
    style LOCKDOWN fill:#e74c3c,color:#fff
    style CLOSE fill:#27ae60,color:#fff
```

### PCI-DSS Continuous Compliance

| Requirement | Monitoring Mechanism | Auto-Remediation |
|-------------|---------------------|------------------|
| Req 1: Firewall config | Network policy audit every 15 min | Auto-revert unauthorized rule changes |
| Req 2: No vendor defaults | Config scan on deploy | Block deploy with default credentials |
| Req 3: Protect stored data | Encryption-at-rest verification | Alert + auto-enable encryption |
| Req 4: Encrypt transmission | mTLS certificate monitoring | Auto-renew, force TLS 1.3 |
| Req 6: Secure systems | CVE scan on every PR + nightly full scan | Auto-patch, block critical deploys |
| Req 7: Restrict access | RBAC policy audit hourly | Revoke excessive permissions |
| Req 8: Identify users | Auth log anomaly detection | Force re-authentication |
| Req 10: Track access | Audit log completeness check | Alert on missing audit events |
| Req 11: Test security | Automated pen test weekly | Generate findings, create tickets |
| Req 12: Security policy | Policy drift detection | Auto-reconcile to baseline |

### Credential Rotation Schedule

| Credential Type | Rotation Interval | On-Compromise Rotation | Method |
|----------------|-------------------|----------------------|--------|
| Database passwords | 30 days | Immediate | Vault dynamic secrets |
| API keys | 90 days | Immediate | Key pair rotation |
| Service tokens | 24 hours | Immediate | Short-lived JWT via SPIFFE |
| TLS certificates | 60 days (auto-renew at 30) | Immediate | ACME / cert-manager |
| Cloud IAM keys | 7 days | Immediate | STS temporary credentials |
| Encryption keys | 365 days | Immediate | KMS key rotation |

---

## 4. Data Agent

Monitors all data pipeline health with freshness and completeness SLAs. Detects schema drift before it breaks downstream consumers. Auto-fixes broken pipelines with known repair patterns. Classifies PII across all data stores. Optimizes query performance across analytics and operational databases.

### Pipeline Health Monitoring

| Metric | SLA | Detection | Response |
|--------|-----|-----------|----------|
| Freshness | < 5 min for real-time, < 1h for batch | Watermark tracking per pipeline stage | Alert, auto-retry, failover to backup source |
| Completeness | > 99.5% row delivery | Row count reconciliation source vs. target | Auto-backfill missing ranges |
| Schema drift | Zero unexpected changes | Schema registry diff on every write | Block write, notify owner, suggest migration |
| Duplicate rate | < 0.01% | Dedup key monitoring | Auto-dedup, alert if rate exceeds threshold |
| Latency | < 2x baseline per stage | Per-stage timing instrumentation | Identify bottleneck, scale stage, repartition |

### Data Pipeline Architecture

```mermaid
flowchart LR
    subgraph Sources["Data Sources"]
        POS_DATA[POS Transactions]
        WEB_DATA[Web Clickstream]
        MOBILE_DATA[Mobile Events]
        INVENTORY[Inventory Updates]
        ERP[ERP Feed]
    end

    subgraph Ingestion["Ingestion Layer"]
        KAFKA[Kafka Topics]
        CDC[CDC Streams<br/>Debezium]
    end

    subgraph Processing["Processing Layer"]
        FLINK[Flink<br/>Real-Time]
        SPARK[Spark<br/>Batch]
        DBT[dbt<br/>Transform]
    end

    subgraph Storage["Storage Layer"]
        LAKE[(Data Lake<br/>Iceberg / S3)]
        DW[(Data Warehouse<br/>BigQuery / Redshift)]
        FEATURE[(Feature Store<br/>Feast)]
    end

    subgraph Monitoring["Data Agent Monitors"]
        FRESH[Freshness Monitor]
        COMPLETE[Completeness Monitor]
        SCHEMA[Schema Drift Detector]
        PII_SCAN[PII Classifier]
        PERF[Query Performance Optimizer]
    end

    POS_DATA --> KAFKA
    WEB_DATA --> KAFKA
    MOBILE_DATA --> KAFKA
    INVENTORY --> CDC
    ERP --> CDC

    KAFKA --> FLINK
    CDC --> FLINK
    FLINK --> LAKE
    LAKE --> SPARK
    SPARK --> DW
    DW --> DBT
    DBT --> FEATURE

    FRESH -.->|monitors| FLINK
    FRESH -.->|monitors| SPARK
    COMPLETE -.->|monitors| DW
    SCHEMA -.->|monitors| LAKE
    PII_SCAN -.->|scans| LAKE
    PII_SCAN -.->|scans| DW
    PERF -.->|optimizes| DW

    style Monitoring fill:#2d3436,color:#fff
    style Sources fill:#1a1a2e,color:#fff
```

### PII Classification Actions

| Data Class | Examples | Action | Storage Policy |
|------------|----------|--------|----------------|
| PCI (Level 1) | Card numbers, CVV | Tokenize at ingestion, never store raw | Vault tokenization, PCI-scoped access only |
| PII (Level 2) | Name, email, phone, address | Encrypt at rest, mask in analytics | Column-level encryption, RBAC per dataset |
| Sensitive (Level 3) | Purchase history, preferences | Pseudonymize for analytics | Anonymize after 24-month retention |
| Internal (Level 4) | Product catalog, pricing | Standard encryption | Standard access controls |
| Public (Level 5) | Store locations, hours | No special handling | Open access within platform |

---

## 5. Cost Agent

Real-time visibility into cloud spend across AWS, GCP, and Azure. Detects cost anomalies within minutes. Recommends and executes right-sizing. Manages reserved instance and spot instance conversions. Identifies and cleans orphaned resources. Optimizes cross-cloud egress. Provides FinOps dashboards broken down by team, service, and environment.

### Cost Optimization Cycle

```mermaid
flowchart TD
    COLLECT["Collect Spend Data<br/>AWS CUR, GCP Billing Export,<br/>Azure Cost Management<br/>(Real-time streaming)"] --> NORMALIZE["Normalize & Tag<br/>Unified cost model<br/>Map to team/service/env"]

    NORMALIZE --> ANOMALY{"Anomaly<br/>Detection"}

    ANOMALY -->|"Spend > 2x baseline<br/>or > $500 unexpected"| ALERT_COST["Alert Team Owner<br/>Show root cause breakdown<br/>Recommend action"]
    ANOMALY -->|Normal| ANALYZE["Deep Analysis"]

    ANALYZE --> RIGHT_SIZE["Right-Sizing Analysis<br/>CPU util < 20% for 7d → downsize<br/>Memory util < 30% → downsize<br/>Disk IOPS < 10% → switch tier"]

    ANALYZE --> RESERVED["Reserved Instance Analysis<br/>On-demand running > 720h/mo → RI candidate<br/>Compute savings plan coverage gap<br/>Compare 1yr vs 3yr ROI"]

    ANALYZE --> SPOT["Spot/Preemptible Analysis<br/>Stateless workloads → spot candidate<br/>Batch jobs → spot with checkpointing<br/>Dev/staging → spot first"]

    ANALYZE --> ORPHAN["Orphaned Resource Scan<br/>Unattached EBS/disks<br/>Idle load balancers<br/>Unused elastic IPs<br/>Empty S3 buckets<br/>Stale snapshots > 90d"]

    ANALYZE --> EGRESS["Egress Optimization<br/>Cross-cloud transfer analysis<br/>CDN cache hit ratio<br/>Regional affinity scoring<br/>Compression opportunity"]

    RIGHT_SIZE --> EXECUTE{"Auto-Execute?<br/>(Trust Level Check)"}
    RESERVED --> RECOMMEND["Generate Recommendation<br/>with ROI projection"]
    SPOT --> EXECUTE
    ORPHAN --> EXECUTE
    EGRESS --> RECOMMEND

    EXECUTE -->|"L1: Suggest Only"| RECOMMEND
    EXECUTE -->|"L2+: Auto-Fix"| APPLY["Apply Change<br/>Scale down instance<br/>Convert to spot<br/>Delete orphan<br/>Update ASG config"]

    APPLY --> VALIDATE["Validate Change<br/>No performance regression<br/>No availability impact<br/>Cost reduction confirmed"]

    VALIDATE -->|Regression| REVERT["Revert Change<br/>Alert team"]
    VALIDATE -->|Success| DASHBOARD["Update FinOps Dashboard<br/>Savings recorded<br/>Team attribution"]

    RECOMMEND --> DASHBOARD

    style ALERT_COST fill:#e74c3c,color:#fff
    style DASHBOARD fill:#27ae60,color:#fff
    style REVERT fill:#f39c12,color:#000
```

### FinOps Dashboard Dimensions

| Dimension | Breakdown | Metrics |
|-----------|-----------|---------|
| By Team | Platform, Commerce, Payments, Data, Mobile, AI/ML | Monthly spend, trend, budget vs. actual |
| By Service | Each microservice, database, cache, queue | Cost per request, cost per transaction |
| By Environment | Production, staging, dev, sandbox | Prod-to-dev ratio (target: 5:1) |
| By Cloud | AWS, GCP, Azure | Per-cloud spend, cross-cloud egress |
| By Category | Compute, storage, network, database, AI/ML inference | Category trends, unit economics |
| By Tier | Tier 1 (mission critical), Tier 2, Tier 3 | Cost of redundancy per tier |

### Optimization Targets

| Strategy | Current State | Target | Estimated Annual Savings |
|----------|--------------|--------|--------------------------|
| Right-sizing | 40% of instances over-provisioned | < 10% over-provisioned | $180K |
| Reserved instances | 30% RI coverage | 70% RI coverage | $320K |
| Spot/preemptible | 5% spot usage | 40% for eligible workloads | $150K |
| Orphaned resources | ~120 orphans discovered monthly | 0 orphans > 48h old | $60K |
| Egress optimization | 15% of spend on egress | < 8% of spend on egress | $200K |
| Storage tiering | 80% in hot storage | Lifecycle policies on all buckets | $90K |

---

## 6. Project Sentinel Fleet

One sentinel per cloud project. Each sentinel inhabits its assigned project, crawling through every resource, configuration, and permission boundary. Sentinels operate in day/night duty cycles and collaborate via the A2A protocol. See **[Project Sentinel Agents](./project-sentinels)** for the full architecture, phased rollout plan, and daily digest format.

### Sentinel ↔ Central Agent Integration

```mermaid
sequenceDiagram
    participant S as Sentinel: payments-prod
    participant ORCH as Agent Orchestrator
    participant SRE as SRE Agent
    participant SEC as Security Agent
    participant COST as Cost Agent
    participant KG as Knowledge Graph

    Note over S: Day Mode: Patrol Cycle

    S->>S: Scan all 6 domains (compute, network, storage, IAM, data, cost)
    S->>KG: Write: 47 observations, 3 warnings, 0 critical

    S->>S: Detect: service account with unused admin permissions
    S->>ORCH: Escalate: security finding (cross-project relevance)
    ORCH->>SEC: Route: IAM finding from sentinel-payments-prod
    SEC->>SEC: Correlate with org-wide IAM audit
    SEC-->>S: Acknowledged: added to org-wide remediation queue

    S->>S: Detect: cost anomaly ($200/day spike on unused GPU instances)
    S->>ORCH: Escalate: cost finding
    ORCH->>COST: Route: cost anomaly from sentinel-payments-prod
    COST-->>S: Confirmed: flagged for right-sizing

    Note over S: End of Day: Generate Digest
    S->>S: Compile daily digest for payments-team@
```

### Phased Rollout Summary

| Phase | Trust Level | Duration | Key Capability | Graduation Gate |
|-------|-------------|----------|----------------|-----------------|
| 1: Shadow Observer | L0 | Days 1-30 | Read-only monitoring, baseline building | Accuracy > 90%, engineer sign-off |
| 2: Guided Assistant | L1 | Days 31-120 | Propose actions, create tickets, draft runbooks | 70%+ suggestions accepted, 0 critical errors |
| 3: Autonomous Operator | L2 | Days 121-300 | Auto-remediate, fix on request, share playbooks | 99%+ accuracy, 0 incidents, board approval |
| 4: Predictive Guardian | L3 | Day 301+ | Predict issues, block risks, mentor new sentinels | Continuous 99%+ accuracy, quarterly review |

### Fleet Scaling

| Metric | Value |
|--------|-------|
| Sentinels per org | 100-200 (one per cloud project) |
| Resource footprint | ~256MB RAM, 0.25 vCPU per sentinel |
| LLM cost | $2-5/day per sentinel (tiered: Haiku → Sonnet → Opus) |
| Rollout pace | 5 projects initially, +10-20/month, full coverage in 6-12 months |
| Night-mode A2A traffic | < 100 messages per sentinel per night |

---

## Cross-Agent Workflow: Black Friday Preparation

```mermaid
sequenceDiagram
    participant COST as Cost Agent
    participant DEPLOY as Deployment Agent
    participant SRE as SRE Agent
    participant SEC as Security Agent
    participant DATA as Data Agent
    participant KG as Knowledge Graph

    Note over COST,DATA: T-14 days: Black Friday Preparation

    COST->>KG: Query: last year's Black Friday resource usage
    KG-->>COST: Peak: 12x baseline compute, 8x database connections
    COST->>SRE: Pre-scale recommendation: 15x compute (20% buffer)
    SRE->>SRE: Pre-scale Kubernetes clusters across all 3 clouds
    SRE->>KG: Write: pre-scale complete, capacity verified

    DEPLOY->>DEPLOY: Activate deploy freeze (full week)
    DEPLOY->>KG: Write: deploy freeze active, override requires VP approval

    SEC->>SEC: Rotate all credentials pre-event
    SEC->>SEC: Enable enhanced WAF rules (bot protection, rate limiting)
    SEC->>KG: Write: security posture hardened for Black Friday

    DATA->>DATA: Pre-warm analytics caches
    DATA->>DATA: Scale Flink parallelism 4x
    DATA->>KG: Write: data pipelines scaled, freshness SLA tightened to 2 min

    Note over COST,DATA: T-0: Black Friday Active

    SRE->>SRE: Monitor all 5 layers at 10s intervals (vs. normal 60s)
    COST->>COST: Suspend cost optimization (no right-sizing during peak)
    SEC->>SEC: Real-time fraud scoring at elevated sensitivity
    DATA->>DATA: Stream sales dashboards in real-time to executives

    Note over COST,DATA: T+2 days: Post-Event

    DEPLOY->>DEPLOY: Lift deploy freeze
    SRE->>SRE: Gradual scale-down over 48 hours
    COST->>COST: Generate Black Friday cost report + ROI analysis
    COST->>COST: Resume optimization cycle
    DATA->>DATA: Run full data reconciliation (POS vs. online vs. warehouse)
```

---

## Operational SLAs

| Agent | Response Time | Auto-Remediation Time | Escalation Threshold | Audit Requirement |
|-------|--------------|----------------------|---------------------|-------------------|
| SRE Agent | < 5s alert detection | < 60s for known patterns | 2 failed auto-remediations | Every action logged to Knowledge Graph |
| Deployment Agent | < 30s PR risk assessment | < 60s rollback | Canary failure at any stage | Full deploy trace with metrics snapshots |
| Security Agent | < 1s threat detection | < 10s for blocking actions | Any PCI-DSS violation | Immutable audit log, 7-year retention |
| Data Agent | < 1 min freshness check | < 5 min pipeline repair | Data freshness > 3x SLA | Pipeline lineage tracked end-to-end |
| Cost Agent | < 5 min anomaly detection | < 1h for safe optimizations | Spend anomaly > $1000 | All changes tracked with cost impact |
| Sentinel Fleet | < 10s patrol cycle | < 60s for known patterns (L2+) | Unresponsive > 5 min | Every action logged to Knowledge Graph + daily digest |
