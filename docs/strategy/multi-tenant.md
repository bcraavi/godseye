---
sidebar_position: 3
title: Multi-Tenant Architecture
sidebar_label: "🏢 Multi-Tenant Architecture"
---

# 🏢 Multi-Tenant Architecture

GodsEye uses a **Bridge Model** multi-tenancy approach -- a tiered isolation strategy that lets each tenant operate at the isolation level matching their size, compliance posture, and budget. Tenant tiers map to [pricing tiers](./open-core.md): Free users get Standard isolation, Team gets Enterprise isolation, Enterprise gets Premium isolation.

## Tenant Tiers

| Dimension | Standard | Enterprise | Premium |
|---|---|---|---|
| **Target** | Smaller retailers | Mid-market ($1-10B rev) | Large retailers ($10B+) / strict compliance |
| **Compute** | Shared K8s namespaces | Shared cluster, dedicated node pools | Dedicated clusters |
| **Database** | Shared PostgreSQL, schema-per-tenant | Dedicated DB instance per tenant | Dedicated DB + dedicated cloud project |
| **Encryption** | Platform-managed keys | Per-tenant keys (cloud KMS) | Per-tenant keys + HSM-backed |
| **Network** | Namespace-level network policies | Node-pool-level isolation + mTLS | Dedicated VPC / VNet |
| **Compliance** | SOC 2 shared | SOC 2 + PCI-DSS Level 2 | PCI-DSS Level 1 scope, HIPAA-ready |

```mermaid
graph TB
    subgraph "Premium Tier"
        direction TB
        PC[Dedicated Cluster] --> PD[Dedicated DB]
        PC --> PV[Dedicated VPC]
        PD --> PK[HSM-Backed Keys]
    end

    subgraph "Enterprise Tier"
        direction TB
        EC[Shared Cluster / Dedicated Node Pool] --> ED[Dedicated DB Instance]
        EC --> EN[Node-Pool Isolation]
        ED --> EK[Per-Tenant KMS Keys]
    end

    subgraph "Standard Tier"
        direction TB
        SC[Shared K8s Namespace] --> SD[Shared DB / Schema Isolation]
        SC --> SN[Namespace Network Policy]
        SD --> SK[Platform-Managed Keys]
    end

    style PC fill:#e74c3c,color:#fff
    style PD fill:#e74c3c,color:#fff
    style PV fill:#e74c3c,color:#fff
    style PK fill:#e74c3c,color:#fff
    style EC fill:#f39c12,color:#fff
    style ED fill:#f39c12,color:#fff
    style EN fill:#f39c12,color:#fff
    style EK fill:#f39c12,color:#fff
    style SC fill:#3498db,color:#fff
    style SD fill:#3498db,color:#fff
    style SN fill:#3498db,color:#fff
    style SK fill:#3498db,color:#fff
```

## Data Isolation

### Schema-per-Tenant (Standard)

Each tenant gets a dedicated PostgreSQL schema within a shared database instance. All queries are scoped by `tenant_id` enforced at the ORM/query layer and verified via row-level security (RLS) policies.

### Dedicated DB (Enterprise / Premium)

Enterprise and Premium tenants receive a fully dedicated database instance provisioned via Terraform. Connection routing is handled at the platform layer -- the application resolves the correct connection pool based on the tenant context extracted from the incoming request.

### Encryption and Residency

- **At rest**: AES-256 encryption. Standard tenants share a platform key; Enterprise/Premium tenants get a dedicated key in the cloud KMS (AWS KMS / GCP Cloud KMS / Azure Key Vault).
- **Data residency**: Per-tenant configuration specifies allowed regions. The platform enforces that tenant data is stored and processed only in those regions.
- **Cross-tenant leakage prevention**: Query-level enforcement (RLS + ORM tenant scoping), plus audit logging of every cross-schema/cross-DB access attempt.

```mermaid
graph LR
    subgraph "Request Path"
        REQ[Incoming Request] --> GW[API Gateway]
        GW -->|Extract tenant_id| TR[Tenant Router]
    end

    subgraph "Standard Tenants"
        TR -->|standard| SP[(Shared PostgreSQL)]
        SP --> S1[Schema: tenant_001]
        SP --> S2[Schema: tenant_002]
        SP --> S3[Schema: tenant_003]
    end

    subgraph "Enterprise Tenants"
        TR -->|enterprise| ED1[(DB: tenant_100)]
        TR -->|enterprise| ED2[(DB: tenant_101)]
    end

    subgraph "Premium Tenants"
        TR -->|premium| PD1[(Isolated DB: tenant_200)]
    end

    subgraph "Key Management"
        KMS[Cloud KMS]
        KMS --> PK1[Platform Key]
        KMS --> TK1[Tenant-100 Key]
        KMS --> TK2[Tenant-101 Key]
        KMS --> TK3[Tenant-200 Key + HSM]
    end

    PK1 -.->|encrypts| SP
    TK1 -.->|encrypts| ED1
    TK2 -.->|encrypts| ED2
    TK3 -.->|encrypts| PD1
```

## Compute Isolation

### Network Policies

Default-deny between all tenant namespaces. Ingress/egress rules are explicitly defined per namespace, allowing only platform services (API gateway, service mesh control plane) to communicate cross-namespace.

### Service Mesh (Istio)

All service-to-service calls use mTLS. Tenant context is propagated via request headers (`X-Tenant-ID`, `X-Tenant-Tier`). Authorization policies in Istio enforce that a service can only access resources for the tenant identified in the request.

```mermaid
graph TB
    subgraph "Cloud Region"
        LB[Load Balancer / CloudFlare]

        subgraph "K8s Cluster - Shared"
            ISCP[Istio Control Plane]

            subgraph "Namespace: tenant-001 (Standard)"
                S1A[Pod: API] --> S1B[Pod: Worker]
                S1A -.->|mTLS| S1B
            end

            subgraph "Namespace: tenant-002 (Standard)"
                S2A[Pod: API] --> S2B[Pod: Worker]
                S2A -.->|mTLS| S2B
            end

            subgraph "Node Pool: tenant-100 (Enterprise)"
                E1A[Pod: API] --> E1B[Pod: Worker]
                E1A -.->|mTLS| E1B
            end

            NP[Network Policy: Default Deny Cross-Namespace]
        end

        subgraph "K8s Cluster - Dedicated (Premium)"
            subgraph "Namespace: tenant-200"
                P1A[Pod: API] --> P1B[Pod: Worker]
                P1A -.->|mTLS| P1B
            end
        end

        LB --> ISCP
        ISCP --> S1A
        ISCP --> S2A
        ISCP --> E1A
        ISCP --> P1A
    end
```

## Tenant Onboarding Flow

```mermaid
sequenceDiagram
    participant Admin as Platform Admin
    participant CP as Control Plane
    participant TF as Terraform / Crossplane
    participant K8s as Kubernetes
    participant DNS as CloudFlare DNS
    participant DI as Data Importer

    Admin->>CP: Create Tenant (name, tier, config)
    CP->>CP: Validate & assign tenant_id

    alt Standard Tier
        CP->>TF: Provision DB schema in shared instance
    else Enterprise Tier
        CP->>TF: Provision dedicated DB instance
    end

    TF-->>CP: DB ready

    CP->>K8s: Create namespace / node pool
    K8s-->>CP: Compute ready

    CP->>K8s: Deploy tenant ConfigMap & Secrets
    CP->>K8s: Apply NetworkPolicy & Istio AuthZ

    CP->>DNS: Create subdomain (tenant.godseye.io)
    DNS-->>CP: DNS propagated

    CP->>DI: Trigger initial data import
    DI->>DI: Import products, inventory, historical orders
    DI-->>CP: Import complete

    CP->>CP: Activate tenant
    CP-->>Admin: Tenant live
```

### Onboarding Steps Summary

| Step | Action | Tooling |
|---|---|---|
| 1 | Create tenant record | Control Plane API |
| 2 | Provision database | Terraform / Crossplane |
| 3 | Deploy K8s resources | ArgoCD + Helm |
| 4 | Configure DNS | CloudFlare API |
| 5 | Import initial data | Custom data pipeline (Kafka + workers) |
| 6 | Activate | Feature flag flip + health check |

## Tenant Configuration

Each tenant carries a configuration object that controls platform behavior:

```yaml
# Example: tenant-100.yaml
tenant:
  id: tenant-100
  name: "Acme Retail"
  tier: enterprise
  region: us-east-1
  features:
    ai_agents: true
    demand_forecasting: true
    dynamic_pricing: false       # not enabled for this tenant
    real_time_analytics: true
  branding:
    primary_color: "#1a73e8"
    logo_url: "https://cdn.godseye.io/tenant-100/logo.svg"
  integrations:
    erp: sap_s4hana
    pos: oracle_xstore
    payment: adyen
  compliance:
    pci_dss_level: 2
    data_residency: [us-east-1, us-west-2]
  ai:
    llm_provider: claude          # tenant-level LLM preference
    self_hosted_models: false
    agent_memory_ttl: 30d
```

## Request Routing with Tenant Context

Every request entering the platform is stamped with tenant context at the edge and carries it through the entire call chain.

```mermaid
graph LR
    subgraph "Edge"
        CF[CloudFlare] -->|tenant-100.godseye.io| GW[API Gateway]
    end

    subgraph "Gateway"
        GW -->|1. Extract tenant from subdomain| TL[Tenant Lookup]
        TL -->|2. Load tenant config| TC[Tenant Context]
        TC -->|3. Inject headers| RQ[Request]
    end

    subgraph "Headers Propagated"
        RQ -->|X-Tenant-ID: tenant-100| SVC1[Service A]
        SVC1 -->|X-Tenant-ID: tenant-100| SVC2[Service B]
        SVC2 -->|X-Tenant-ID: tenant-100| DB[(Tenant DB)]
    end

    subgraph "Enforcement Points"
        EP1[Istio Sidecar: AuthZ check]
        EP2[ORM: tenant_id scoping]
        EP3[RLS: PostgreSQL policy]
    end

    SVC1 -.-> EP1
    SVC2 -.-> EP2
    DB -.-> EP3
```

## Scaling and Noisy-Neighbor Prevention

| Mechanism | Purpose |
|---|---|
| **HPA per tenant namespace** | Horizontal Pod Autoscaling scoped to each tenant's workloads |
| **Resource Quotas** | CPU/memory limits per namespace prevent a single tenant from starving others |
| **Priority Classes** | Higher-tier tenants get scheduling priority during contention |
| **Pod Disruption Budgets** | Ensure minimum replica counts during cluster operations |
| **Tenant-aware scheduling** | Affinity/anti-affinity rules place enterprise/premium pods on dedicated node pools |
| **Rate limiting** | Per-tenant rate limits at the API gateway (token bucket) |

```yaml
# Example: ResourceQuota for a Standard tenant namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-001-quota
  namespace: tenant-001
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "50"
    services: "10"
    persistentvolumeclaims: "5"
```
