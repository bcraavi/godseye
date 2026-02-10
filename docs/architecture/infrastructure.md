---
sidebar_position: 2
sidebar_label: "☁️ Multi-Cloud Infrastructure"
---

# ☁️ Layer 1 -- Multi-Cloud Infrastructure

> **The Triplet Model -- Three Clouds, Zero Data Centers, Never Go Down.** See [Triplet Model Strategy](../strategy/triplet-model.md) for the full methodology.

GodsEye runs active-active across three cloud providers. Every critical byte has three homes. No single cloud failure takes the platform offline.

---

## Multi-Cloud Network Topology

```mermaid
graph TB
    subgraph GLOBAL["Global Edge Layer"]
        DNS["Global DNS<br/>(Route 53 + Cloud DNS + Azure DNS)<br/>Latency-based + health-check routing"]
        CF["CloudFlare CDN<br/>WAF / DDoS / Edge Cache"]
    end

    DNS --> CF

    subgraph AWS["AWS us-east-1"]
        ALB_AWS["ALB<br/>Application Load Balancer"]
        subgraph AWS_K8S["EKS Cluster"]
            AWS_CRITICAL["Critical Services Pod<br/>(Tier 1)"]
            AWS_STANDARD["Standard Services Pod<br/>(Tier 2 & 3)"]
        end
        RDS_AWS["Aurora PostgreSQL<br/>(CockroachDB Compatible)"]
        S3_AWS["S3<br/>Object Storage"]
        MSK_AWS["Amazon MSK<br/>Kafka"]
    end

    subgraph GCP["GCP us-east1"]
        ALB_GCP["Cloud Load Balancer"]
        subgraph GCP_K8S["GKE Cluster"]
            GCP_CRITICAL["Critical Services Pod<br/>(Tier 1)"]
            GCP_STANDARD["Standard Services Pod<br/>(Tier 2 & 3)"]
        end
        SPANNER["Cloud Spanner<br/>(CockroachDB Compatible)"]
        GCS["Cloud Storage<br/>Object Storage"]
        PUBSUB["Pub/Sub + Kafka Bridge"]
    end

    subgraph AZURE["Azure eastus"]
        ALB_AZ["Azure Front Door"]
        subgraph AZ_K8S["AKS Cluster"]
            AZ_CRITICAL["Critical Services Pod<br/>(Tier 1)"]
            AZ_STANDARD["Standard Services Pod<br/>(Tier 2 & 3)"]
        end
        COSMOS["Cosmos DB<br/>(PostgreSQL Wire Protocol)"]
        BLOB["Azure Blob Storage"]
        EVENTHUB["Event Hubs<br/>Kafka Protocol"]
    end

    CF --> ALB_AWS
    CF --> ALB_GCP
    CF --> ALB_AZ

    ALB_AWS --> AWS_K8S
    ALB_GCP --> GCP_K8S
    ALB_AZ --> AZ_K8S

    AWS_CRITICAL --> RDS_AWS
    AWS_STANDARD --> RDS_AWS
    AWS_CRITICAL --> S3_AWS
    AWS_STANDARD --> MSK_AWS

    GCP_CRITICAL --> SPANNER
    GCP_STANDARD --> SPANNER
    GCP_CRITICAL --> GCS
    GCP_STANDARD --> PUBSUB

    AZ_CRITICAL --> COSMOS
    AZ_STANDARD --> COSMOS
    AZ_CRITICAL --> BLOB
    AZ_STANDARD --> EVENTHUB

    subgraph SYNC["Cross-Cloud Data Sync"]
        CRDB_SYNC["CockroachDB / Spanner<br/>Real-Time Replication<br/>(RPO < 1s)"]
        KAFKA_MM["Kafka MirrorMaker 2.0<br/>Event Replication<br/>(RPO < 5s)"]
        OBJ_SYNC["Object Storage Replication<br/>Batch Sync<br/>(RPO < 15 min)"]
    end

    RDS_AWS <--> CRDB_SYNC
    SPANNER <--> CRDB_SYNC
    COSMOS <--> CRDB_SYNC

    MSK_AWS <--> KAFKA_MM
    PUBSUB <--> KAFKA_MM
    EVENTHUB <--> KAFKA_MM

    S3_AWS <--> OBJ_SYNC
    GCS <--> OBJ_SYNC
    BLOB <--> OBJ_SYNC

    subgraph MESH["Critical Services Mesh (Istio Multi-Cluster)"]
        MESH_NOTE["Spans all 3 clouds<br/>mTLS everywhere<br/>Unified service discovery<br/>Cross-cloud load balancing"]
    end

    AWS_CRITICAL -.-> MESH
    GCP_CRITICAL -.-> MESH
    AZ_CRITICAL -.-> MESH

    style GLOBAL fill:#1a1a2e,color:#fff
    style AWS fill:#ff9900,color:#000
    style GCP fill:#4285f4,color:#fff
    style AZURE fill:#0078d4,color:#fff
    style SYNC fill:#2d3436,color:#fff
    style MESH fill:#6c5ce7,color:#fff
```

---

## Service Tier Classification

```mermaid
flowchart TD
    START(["New Service Deployment"]) --> Q1{"Is revenue impacted<br/>per second of downtime?"}

    Q1 -->|"YES<br/>(POS, Payments, Inventory Sync,<br/>Pricing Engine, Cart)"| T1["TIER 1 -- Mission Critical"]
    Q1 -->|NO| Q2{"Is UX degraded<br/>for end users?"}

    Q2 -->|"YES<br/>(Search, Recommendations,<br/>Product Catalog, Auth)"| T2["TIER 2 -- Customer Facing"]
    Q2 -->|NO| T3["TIER 3 -- Internal / Async"]

    T1 --> T1_DEPLOY["Deploy: ALL 3 clouds<br/>active-active-active"]
    T1_DEPLOY --> T1_RTO["RTO: < 30 seconds<br/>RPO: 0 (synchronous replication)"]
    T1_RTO --> T1_COST["Cost multiplier: 3.0x"]

    T2 --> T2_DEPLOY["Deploy: 2 clouds<br/>active-warm standby"]
    T2_DEPLOY --> T2_RTO["RTO: < 5 minutes<br/>RPO: < 5 seconds"]
    T2_RTO --> T2_COST["Cost multiplier: 1.8x"]

    T3 --> T3_DEPLOY["Deploy: 1 cloud<br/>cross-region backup"]
    T3_DEPLOY --> T3_RTO["RTO: < 30 minutes<br/>RPO: < 15 minutes"]
    T3_RTO --> T3_COST["Cost multiplier: 1.0x"]

    style T1 fill:#e74c3c,color:#fff,stroke-width:3px
    style T2 fill:#f39c12,color:#000,stroke-width:3px
    style T3 fill:#27ae60,color:#fff,stroke-width:3px
```

---

## Failover Sequence -- AWS Region Failure

```mermaid
sequenceDiagram
    participant DNS as Global DNS
    participant CF as CloudFlare
    participant AWS as AWS us-east-1
    participant GCP as GCP us-east1
    participant AZURE as Azure eastus
    participant CRDB as CockroachDB Sync
    participant OPS as Ops Team / PagerDuty
    participant AI as AI Incident Engine

    Note over AWS: AWS us-east-1 goes down (T=0s)

    DNS->>AWS: Health check fails (3 consecutive)
    DNS->>DNS: Mark AWS unhealthy (T=10s)
    DNS->>CF: Update routing table:<br/>remove AWS endpoints

    rect rgb(46, 204, 113)
        Note over GCP,AZURE: Tier 1 -- Immediate (T=10s-30s)
        CF->>GCP: Route 60% traffic to GCP
        CF->>AZURE: Route 40% traffic to Azure
        GCP->>GCP: Tier 1 services already active<br/>(POS, Payments, Inventory)
        AZURE->>AZURE: Tier 1 services already active<br/>(POS, Payments, Inventory)
        CRDB->>GCP: Confirm replication caught up
        CRDB->>AZURE: Confirm replication caught up
    end

    rect rgb(241, 196, 15)
        Note over GCP,AZURE: Tier 2 -- Warm Standby Activation (T=30s-5min)
        GCP->>GCP: Activate warm standby pods<br/>(Search, Recs, Catalog)
        AZURE->>AZURE: Activate warm standby pods<br/>(Search, Recs, Catalog)
        GCP->>GCP: Scale up K8s node pool
        AZURE->>AZURE: Scale up K8s node pool
    end

    rect rgb(231, 76, 60)
        Note over OPS,AI: Notification & Diagnosis (T=10s-2min)
        AI->>AI: Correlate failure signals
        AI->>AI: Classify: cloud-provider outage
        AI->>OPS: P1 Alert: AWS us-east-1 down<br/>Failover active to GCP + Azure
        OPS->>OPS: Acknowledge incident
        AI->>OPS: Estimated recovery: follow AWS status
    end

    rect rgb(155, 89, 182)
        Note over GCP,AZURE: Tier 3 -- Deferred (T=5min-30min)
        GCP->>GCP: Batch jobs rescheduled
        AZURE->>AZURE: Analytics pipelines redirected
    end

    Note over AWS: AWS recovers (T=variable)
    AWS->>DNS: Health checks pass
    DNS->>DNS: Gradual traffic shift back (canary 5% → 25% → 50% → 100%)
    DNS->>CF: Re-add AWS endpoints with canary weights
    AI->>OPS: AWS recovered. Canary reintroduction started.
```

---

## Auto-Scaling Flow

```mermaid
flowchart TD
    NORMAL(["Normal Operations<br/>Baseline capacity"]) --> DETECT{"Traffic spike<br/>detected?<br/>(> 2x rolling avg)"}

    DETECT -->|NO| NORMAL
    DETECT -->|YES| PREDICT["Predictive Model<br/>checks pattern"]

    PREDICT --> IS_KNOWN{"Matches known pattern?<br/>(Black Friday, Flash Sale,<br/>Regional Event)"}

    IS_KNOWN -->|"YES -- Predicted Event"| PRE_SCALE["Pre-Scale Plan<br/>Load historical profile<br/>Scale to predicted peak + 20% buffer"]
    IS_KNOWN -->|"NO -- Organic Spike"| REACTIVE["Reactive Scale<br/>HPA triggers +50% pods<br/>Cluster autoscaler adds nodes"]

    PRE_SCALE --> SCALE_PRIMARY["Scale Up Primary Cloud<br/>(AWS: add nodes to EKS)"]
    REACTIVE --> SCALE_PRIMARY

    SCALE_PRIMARY --> CAP_CHECK{"Primary cloud<br/>capacity limit<br/>reached?"}

    CAP_CHECK -->|NO| MONITOR["Monitor Metrics<br/>(CPU, Memory, Latency,<br/>Queue Depth, Error Rate)"]
    CAP_CHECK -->|YES| BURST["CLOUD BURST<br/>Spill to secondary cloud"]

    BURST --> BURST_GCP["GCP: Scale GKE pool<br/>Activate burst instances"]
    BURST --> BURST_AZ["Azure: Scale AKS pool<br/>Activate burst instances"]
    BURST_GCP --> MONITOR
    BURST_AZ --> MONITOR

    MONITOR --> STABLE{"Stable for > 15 min?<br/>(Latency P99 < SLA)"}
    STABLE -->|NO| SCALE_PRIMARY
    STABLE -->|YES| COOL{"Traffic returning<br/>to baseline?"}

    COOL -->|NO| MONITOR
    COOL -->|YES| SCALEDOWN["Gradual Scale Down<br/>(10% every 5 min)<br/>Never below baseline + 10%"]
    SCALEDOWN --> NORMAL

    style BURST fill:#e74c3c,color:#fff,stroke-width:3px
    style PRE_SCALE fill:#3498db,color:#fff
    style REACTIVE fill:#f39c12,color:#000
```

---

## Cloud Service Mapping

| Service          | AWS                          | GCP                          | Azure                        | Abstraction Layer            |
|------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| **Compute**      | EC2 / Fargate                | Compute Engine / Cloud Run   | Virtual Machines / ACI       | Terraform + Crossplane       |
| **Kubernetes**   | EKS                          | GKE                          | AKS                          | Cluster API + ArgoCD         |
| **Database**     | Aurora PostgreSQL             | Cloud Spanner                | Cosmos DB (PG wire)          | CockroachDB compatibility    |
| **Object Store** | S3                           | Cloud Storage                | Blob Storage                 | MinIO gateway abstraction    |
| **Load Balancer**| ALB / NLB                    | Cloud Load Balancing         | Azure Front Door             | Envoy / Istio ingress        |
| **CDN**          | CloudFront (backup)          | Cloud CDN (backup)           | Azure CDN (backup)           | CloudFlare (primary)         |
| **IAM**          | AWS IAM                      | Cloud IAM                    | Entra ID                     | SPIFFE/SPIRE + OPA           |
| **Secrets**      | Secrets Manager              | Secret Manager               | Key Vault                    | HashiCorp Vault (primary)    |
| **Message Queue**| MSK (Kafka)                  | Pub/Sub + Kafka bridge       | Event Hubs (Kafka protocol)  | Kafka API abstraction        |
| **Monitoring**   | CloudWatch                   | Cloud Monitoring             | Azure Monitor                | Prometheus + Grafana (primary)|
| **DNS**          | Route 53                     | Cloud DNS                    | Azure DNS                    | CloudFlare DNS (primary)     |
| **Container Reg**| ECR                          | Artifact Registry            | ACR                          | Harbor (primary)             |

---

## Egress Cost Strategy

| Strategy                          | Mechanism                                                        | Estimated Savings |
|-----------------------------------|------------------------------------------------------------------|-------------------|
| **CloudFlare Bandwidth Alliance** | Zero egress from participating clouds through CF                 | 40-60%            |
| **Compression at Edge**           | Brotli / gzip on all API responses; protobuf for service-to-service | 20-30%            |
| **Regional Affinity Routing**     | Keep requests within same cloud when possible; cross-cloud only for sync | 15-25%            |
| **Batch Sync Windows**            | Object storage replication during off-peak (2am-6am UTC)         | 10-15%            |
| **Data Gravity Awareness**        | Place compute near data; avoid cross-cloud reads for analytics   | 15-20%            |
| **Kafka Topic Partitioning**      | Partition by region; only replicate partition leaders cross-cloud | 20-30%            |
| **gRPC over REST**                | Binary protocol for all internal service communication           | 30-40% on payload |
| **Committed Use Discounts**       | 1-3 year commitments on baseline egress across all 3 clouds      | 20-40%            |
| **Edge Caching TTL Tuning**       | Aggressive caching for catalog/images (TTL 24h); short for pricing (TTL 60s) | 50-70% on static |

---

## Design Principles

1. **No cloud-native lock-in** -- Every managed service has an OSS abstraction in front of it.
2. **Terraform + Crossplane** -- All infrastructure is declarative and version-controlled.
3. **Blast radius containment** -- A single cloud failure never exceeds 33% capacity loss.
4. **Cost-aware tiering** -- Not everything needs 3x replication. Tier accordingly.
5. **Egress is the enemy** -- Treat cross-cloud bandwidth as a first-class cost center.
