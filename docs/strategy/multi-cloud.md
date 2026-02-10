---
sidebar_position: 2
title: Multi-Cloud Strategy
sidebar_label: "☁️ Multi-Cloud Strategy"
---

# ☁️ Multi-Cloud Strategy

> **The Triplet Model:** GodsEye runs on AWS (primary), GCP (secondary), and Azure (tertiary) — three clouds, zero data centers. Every layer of the stack — infrastructure, development, data, AI, and operations — is distributed across this triangle. See [Triplet Model Strategy](./triplet-model.md) for the full methodology.

---

## Service Tier Classification

Every GodsEye service is assigned a deployment tier based on business criticality.

### Tier 1 -- CRITICAL ("Never Down")

**Runs on ALL 3 clouds, active-active.**

| Service | AWS | GCP | Azure |
|---|:---:|:---:|:---:|
| Auth / Identity | EKS | GKE | AKS |
| Payment Gateway | EKS | GKE | AKS |
| Cart / Checkout | EKS | GKE | AKS |
| Product Catalog (read) | EKS | GKE | AKS |
| Order Capture | EKS | GKE | AKS |
| POS Engine | EKS | GKE | AKS |
| DNS / GLB | Route 53 | Cloud DNS | Azure DNS |
| CDN | CloudFront | Cloud CDN | Azure CDN |
| Session Store | ElastiCache | Memorystore | Azure Cache |
| SSL/TLS Termination | ALB | GCP GLB | Front Door |
| Rate Limiting | EKS | GKE | AKS |
| Health Check Orchestrator | EKS | GKE | AKS |

### Tier 2 -- IMPORTANT ("Degrade Gracefully")

**Runs on 2 clouds, active-passive.**

| Service | Primary | Secondary |
|---|---|---|
| Inventory | AWS | GCP |
| Search | AWS | GCP |
| Customer Profile | GCP | Azure |
| Pricing Engine | AWS | GCP |
| Notifications | AWS | Azure |
| AI Shopping Assistant | GCP | AWS |
| Fraud Detection | AWS | GCP |
| API Gateway | AWS | GCP |
| Kafka / Event Bus | AWS (MSK) | GCP (Pub/Sub) |
| Observability Pipeline | AWS | GCP |

### Tier 3 -- STANDARD ("Recover in Hours")

**Runs on 1 cloud. Cold standby or restore-from-backup.**

| Service | Cloud |
|---|---|
| Merchandising | AWS |
| Supply Chain Planning | AWS |
| Vendor Portal | GCP |
| Workforce Management | Azure |
| Finance / Accounting | AWS |
| Analytics / BI | GCP (BigQuery) |
| Marketing Automation | AWS |
| Returns Processing | AWS |
| CI/CD Platform | GCP |
| Developer Portal | GCP |
| Data Warehouse | GCP (BigQuery) |
| Batch Processing | AWS (EMR) |

---

## Three-Tier Deployment Architecture

```mermaid
flowchart TB
    subgraph GLB["Global Traffic Layer"]
        DNS["CloudFlare + Route53\nGlobal DNS"]
        GLB_LB["Global Load Balancer\n(latency-based routing)"]
    end

    DNS --> GLB_LB

    subgraph AWS["AWS (us-east-1, eu-west-1)"]
        direction TB
        AWS_LB["ALB"]
        subgraph AWS_T1["Tier 1 — Active"]
            AWS_AUTH["Auth"]
            AWS_PAY["Payments"]
            AWS_CART["Cart"]
            AWS_CAT["Catalog"]
            AWS_ORD["Orders"]
            AWS_POS["POS"]
        end
        subgraph AWS_T2["Tier 2 — Primary"]
            AWS_INV["Inventory"]
            AWS_SRCH["Search"]
            AWS_PRICE["Pricing"]
            AWS_FRAUD["Fraud"]
        end
        subgraph AWS_T3["Tier 3"]
            AWS_MERCH["Merchandising"]
            AWS_FIN["Finance"]
            AWS_MKT["Marketing"]
        end
        AWS_LB --> AWS_T1 & AWS_T2 & AWS_T3
    end

    subgraph GCP["GCP (us-central1, europe-west1)"]
        direction TB
        GCP_LB["GCP GLB"]
        subgraph GCP_T1["Tier 1 — Active"]
            GCP_AUTH["Auth"]
            GCP_PAY["Payments"]
            GCP_CART["Cart"]
            GCP_CAT["Catalog"]
            GCP_ORD["Orders"]
            GCP_POS["POS"]
        end
        subgraph GCP_T2["Tier 2 — Secondary"]
            GCP_INV["Inventory"]
            GCP_SRCH["Search"]
            GCP_AI["AI Shopping"]
        end
        subgraph GCP_T3["Tier 3"]
            GCP_ANALYTICS["Analytics"]
            GCP_VENDOR["Vendor Portal"]
            GCP_CICD["CI/CD"]
        end
        GCP_LB --> GCP_T1 & GCP_T2 & GCP_T3
    end

    subgraph AZ["Azure (eastus, westeurope)"]
        direction TB
        AZ_LB["Azure Front Door"]
        subgraph AZ_T1["Tier 1 — Active"]
            AZ_AUTH["Auth"]
            AZ_PAY["Payments"]
            AZ_CART["Cart"]
            AZ_CAT["Catalog"]
            AZ_ORD["Orders"]
            AZ_POS["POS"]
        end
        subgraph AZ_T2["Tier 2 — Secondary"]
            AZ_CUST["Customer Profile"]
            AZ_NOTIF["Notifications"]
        end
        subgraph AZ_T3["Tier 3"]
            AZ_WFM["Workforce Mgmt"]
        end
        AZ_LB --> AZ_T1 & AZ_T2 & AZ_T3
    end

    GLB_LB --> AWS_LB & GCP_LB & AZ_LB

    style AWS fill:#ff9900,color:#000
    style GCP fill:#4285f4,color:#fff
    style AZ fill:#0078d4,color:#fff
    style AWS_T1 fill:#16a34a,color:#fff
    style GCP_T1 fill:#16a34a,color:#fff
    style AZ_T1 fill:#16a34a,color:#fff
```

---

## Cross-Cloud Network Topology

```mermaid
flowchart TB
    subgraph Internet["Public Internet"]
        USERS["Users / POS / Mobile"]
    end

    subgraph DNS_Layer["DNS Layer"]
        CF["CloudFlare\n(DDoS, WAF, DNS)"]
        R53["Route 53\n(failover routing)"]
    end

    USERS --> CF --> R53

    subgraph AWS_Net["AWS Network"]
        AWS_ALB["ALB\n(TLS termination)"]
        AWS_MESH["Istio Mesh\n(EKS)"]
        AWS_DB["Aurora +\nElastiCache"]
    end

    subgraph GCP_Net["GCP Network"]
        GCP_GLB["GCP GLB\n(TLS termination)"]
        GCP_MESH["Istio Mesh\n(GKE)"]
        GCP_DB["Spanner +\nMemorystore"]
    end

    subgraph AZ_Net["Azure Network"]
        AZ_FD["Front Door\n(TLS termination)"]
        AZ_MESH["Istio Mesh\n(AKS)"]
        AZ_DB["Cosmos DB +\nAzure Cache"]
    end

    R53 --> AWS_ALB & GCP_GLB & AZ_FD
    AWS_ALB --> AWS_MESH --> AWS_DB
    GCP_GLB --> GCP_MESH --> GCP_DB
    AZ_FD --> AZ_MESH --> AZ_DB

    subgraph CrossCloud["Cross-Cloud Service Mesh"]
        CONSUL["Consul Connect\n(mTLS, service discovery)"]
        CB["Circuit Breakers\n(per-cloud health)"]
        FAILOVER["Auto-Failover\nController"]
    end

    AWS_MESH <--> CONSUL
    GCP_MESH <--> CONSUL
    AZ_MESH <--> CONSUL
    CONSUL --> CB --> FAILOVER

    subgraph DataSync["Cross-Cloud Data Plane"]
        CRDB["CockroachDB\n(multi-region)"]
        KAFKA["Kafka MirrorMaker 2\n(event replication)"]
        OBJ["S3 ↔ GCS ↔ Blob\n(object replication)"]
    end

    AWS_DB <--> CRDB
    GCP_DB <--> CRDB
    AZ_DB <--> CRDB
    AWS_DB <--> KAFKA <--> GCP_DB
    KAFKA <--> AZ_DB

    style CrossCloud fill:#7c3aed,color:#fff
    style DataSync fill:#0891b2,color:#fff
```

### Network Specifications

| Component | Technology | Purpose |
|---|---|---|
| Global DNS | CloudFlare + Route 53 | DDoS protection, latency-based routing, failover |
| Per-Cloud LB | ALB / GCP GLB / Azure Front Door | TLS termination, health checks, regional routing |
| Service Mesh | Istio + Consul Connect | mTLS between services, circuit breakers, auto-failover |
| Cross-Cloud Mesh | Consul Connect (WAN federation) | Service discovery across clouds, encrypted tunnels |
| Kubernetes | EKS / GKE / AKS | Container orchestration per cloud |

---

## Cross-Cloud Data Sync

```mermaid
flowchart LR
    subgraph RT["Real-Time < 1s"]
        direction TB
        RT_DATA["Cart State\nSession Data\nAuth Tokens\nPayment State"]
        RT_TECH["CockroachDB / Spanner\n+ Redis CRDT"]
    end

    subgraph NRT["Near-Real-Time < 30s"]
        direction TB
        NRT_DATA["Product Catalog\nInventory Counts\nCustomer Profiles\nOrder State"]
        NRT_TECH["Kafka MirrorMaker 2\n+ Change Data Capture"]
    end

    subgraph BATCH["Batch (Hourly / Daily)"]
        direction TB
        BATCH_DATA["Analytics Events\nHistorical Data\nVendor Data\nML Training Sets"]
        BATCH_TECH["S3 → GCS → Blob\nCross-Region Replication"]
    end

    RT_DATA --> RT_TECH
    NRT_DATA --> NRT_TECH
    BATCH_DATA --> BATCH_TECH

    subgraph Clouds["Target Clouds"]
        AWS_S["AWS"]
        GCP_S["GCP"]
        AZ_S["Azure"]
    end

    RT_TECH --> AWS_S & GCP_S & AZ_S
    NRT_TECH --> AWS_S & GCP_S & AZ_S
    BATCH_TECH --> AWS_S & GCP_S & AZ_S

    style RT fill:#dc2626,color:#fff
    style NRT fill:#f59e0b,color:#000
    style BATCH fill:#6b7280,color:#fff
```

### Sync Tier Details

| Tier | Latency Target | Data Types | Technology | Consistency Model |
|---|---|---|---|---|
| Real-Time | < 1 second | Cart, session, auth tokens, payment state | CockroachDB / Spanner + Redis CRDT | Strong (serializable) for payments; eventual for session |
| Near-Real-Time | < 30 seconds | Catalog, inventory, profiles, orders | Kafka MirrorMaker 2 + CDC | Eventual consistency with ordering guarantees |
| Batch | Hourly / Daily | Analytics, history, vendor data, ML datasets | S3 cross-region replication, scheduled ETL | Eventually consistent, idempotent loads |

---

## Conflict Resolution Strategy

| Data Type | Strategy | Rationale |
|---|---|---|
| Operational data (config, metadata) | **Last-write-wins** (LWW) with vector clocks | Simple, sufficient for low-contention data |
| Cart / Session | **CRDT** (Conflict-free Replicated Data Types) | Supports concurrent updates from multiple clouds without coordination |
| Inventory counts | **Application-level merge** | Business rules determine merge (e.g., min-of-all-counts for safety) |
| Order state | **Event sourcing** | Full audit trail; replay events to reconstruct state after conflict |
| Payment state | **Single-leader with synchronous replication** | Cannot tolerate conflicts; one cloud owns write, others replicate |

---

## Failover Flow

What happens when an entire cloud goes down:

```mermaid
sequenceDiagram
    participant HC as Health Check<br/>Orchestrator
    participant DNS as Global DNS<br/>(CloudFlare + R53)
    participant AWS as AWS
    participant GCP as GCP
    participant AZ as Azure
    participant CONSUL as Consul<br/>Service Mesh

    Note over HC: Continuous health probes<br/>every 5 seconds

    HC->>AWS: Health probe
    AWS--xHC: TIMEOUT (3 consecutive)

    HC->>HC: AWS marked UNHEALTHY

    par Parallel Failover Actions
        HC->>DNS: Remove AWS endpoints<br/>from DNS pool
        HC->>CONSUL: Update service catalog<br/>(AWS services unavailable)
        HC->>GCP: Promote Tier 2 services<br/>from passive → active
        HC->>AZ: Promote Tier 2 services<br/>from passive → active
    end

    Note over DNS: TTL: 30s for Tier 1<br/>DNS propagation < 60s

    DNS->>GCP: Route Tier 1 traffic<br/>(was 33% → now 50%)
    DNS->>AZ: Route Tier 1 traffic<br/>(was 33% → now 50%)

    CONSUL->>GCP: Circuit breaker OPEN<br/>for AWS-dependent calls
    CONSUL->>AZ: Circuit breaker OPEN<br/>for AWS-dependent calls

    Note over GCP,AZ: Tier 1: Zero downtime (active-active)<br/>Tier 2: < 30s failover<br/>Tier 3: Manual recovery (hours)

    HC->>AWS: Health probe (continuous)
    AWS-->>HC: HEALTHY (5 consecutive)
    HC->>HC: AWS marked HEALTHY

    par Recovery
        HC->>DNS: Re-add AWS endpoints
        HC->>CONSUL: Restore AWS services
        HC->>GCP: Demote back to normal weight
        HC->>AZ: Demote back to normal weight
    end

    Note over AWS,AZ: Data sync catches up<br/>via CockroachDB + Kafka
```

### Failover SLAs

| Tier | Detection Time | Failover Time | Total Downtime | Data Loss |
|---|---|---|---|---|
| Tier 1 (Critical) | 15 seconds | 0 seconds (active-active) | **0 seconds** | Zero (synchronous replication) |
| Tier 2 (Important) | 15 seconds | < 30 seconds | **< 45 seconds** | < 1 second of events (async replication) |
| Tier 3 (Standard) | 15 seconds | Manual (1-4 hours) | **1-4 hours** | < 1 hour (backup restore) |

---

## Infrastructure as Code

```mermaid
flowchart TB
    subgraph Source["Source of Truth"]
        GIT["Git Repository\n(platform-infra)"]
    end

    subgraph IaC["Provisioning Layer"]
        TF["Terraform\n(cloud-specific resources)"]
        CP["Crossplane\n(cloud-agnostic abstractions)"]
    end

    subgraph GitOps["GitOps Deployment"]
        ARGO["ArgoCD\n(multi-cluster)"]
    end

    GIT --> TF & CP
    GIT --> ARGO

    subgraph AWS_Infra["AWS Infrastructure"]
        AWS_EKS["EKS Clusters"]
        AWS_RDS["Aurora / ElastiCache"]
        AWS_MSK["MSK (Kafka)"]
        AWS_S3["S3"]
    end

    subgraph GCP_Infra["GCP Infrastructure"]
        GCP_GKE["GKE Clusters"]
        GCP_SPAN["Spanner / Memorystore"]
        GCP_PS["Pub/Sub"]
        GCP_GCS["GCS"]
    end

    subgraph AZ_Infra["Azure Infrastructure"]
        AZ_AKS["AKS Clusters"]
        AZ_COSMOS["Cosmos DB / Azure Cache"]
        AZ_EH["Event Hubs"]
        AZ_BLOB["Blob Storage"]
    end

    TF --> AWS_Infra & GCP_Infra & AZ_Infra
    CP --> AWS_Infra & GCP_Infra & AZ_Infra

    ARGO -->|"Sync workloads"| AWS_EKS & GCP_GKE & AZ_AKS

    subgraph Monitoring["Deployment Observability"]
        GRAF["Grafana\n(unified dashboard)"]
        ALERT["PagerDuty\n(alerting)"]
    end

    AWS_EKS & GCP_GKE & AZ_AKS --> GRAF --> ALERT

    style Source fill:#7c3aed,color:#fff
    style GitOps fill:#22c55e,color:#fff
```

### IaC Stack

| Layer | Tool | Purpose |
|---|---|---|
| Cloud resources | **Terraform** | VPCs, subnets, K8s clusters, managed DBs, IAM -- cloud-specific modules |
| Cloud abstractions | **Crossplane** | Cloud-agnostic CRDs for databases, caches, queues -- single manifest, multi-cloud |
| Workload deployment | **ArgoCD** | GitOps sync of Helm charts and Kustomize overlays to all clusters |
| Secrets | **Vault (HashiCorp)** | Centralized secrets, auto-rotation, cloud-agnostic access |
| Policy | **OPA / Gatekeeper** | Enforce deployment policies (resource limits, labels, security) across all clusters |

### Deployment Flow

```
1. Engineer merges PR to platform-infra repo
2. Terraform Cloud detects change → plans + applies infra changes
3. Crossplane controller reconciles cloud-agnostic resources
4. ArgoCD detects new manifests → syncs to EKS + GKE + AKS
5. Canary rollout: 5% → 25% → 50% → 100% per cloud
6. Grafana dashboards validate health across all clusters
7. Auto-rollback if error rate > 1% in any cloud
```

---

## Cost Model

| Tier | Multi-Cloud Overhead | Justification |
|---|---|---|
| Tier 1 (3x clouds) | ~2.8x single-cloud cost | Revenue-critical. Downtime cost >> infrastructure cost. |
| Tier 2 (2x clouds) | ~1.6x single-cloud cost | Degradation acceptable. Passive replica is minimal compute. |
| Tier 3 (1x cloud) | 1x (no overhead) | Hours of downtime tolerable. Backup restore sufficient. |
| **Blended average** | **~1.7x single-cloud** | Acceptable for enterprise retail SLAs. |

---

## Summary

| Dimension | Approach |
|---|---|
| **Compute** | Kubernetes everywhere (EKS/GKE/AKS) -- identical workloads, cloud-agnostic manifests |
| **Data** | CockroachDB for strong consistency, Kafka for event streaming, object store replication for batch |
| **Networking** | CloudFlare + Consul Connect mesh -- encrypted, observable, auto-failover |
| **Deployment** | Terraform + Crossplane + ArgoCD -- single Git repo, multi-cloud rollout |
| **Failover** | Tier-based: zero downtime (Tier 1), graceful degradation (Tier 2), manual recovery (Tier 3) |
| **Cost** | ~1.7x single-cloud blended. Worth it for five-nines on revenue-critical paths. |
