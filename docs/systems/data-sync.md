---
sidebar_position: 4
sidebar_label: "🔄 Cross-Cloud Data Synchronization"
---

# 🔄 Cross-Cloud Data Synchronization

GodsEye operates across AWS (primary), GCP (secondary), and Azure (tertiary). Every byte of data has a classification tier, a sync method, and a conflict resolution strategy. No exceptions.

## Data Classification & Sync Strategy

```mermaid
graph TD
    subgraph RT["Tier 1: Real-Time < 1s"]
        direction LR
        RT1[Cart State]
        RT2[Session Data]
        RT3[Auth Tokens]
        RT4[Payment Transactions]
        RT5[Inventory Reservations]
    end

    subgraph NRT["Tier 2: Near-Real-Time < 30s"]
        direction LR
        NRT1[Product Catalog]
        NRT2[Inventory Levels]
        NRT3[Customer Profiles]
        NRT4[Order Status]
        NRT5[Promotions]
    end

    subgraph BATCH["Tier 3: Batch — Hourly/Daily"]
        direction LR
        B1[Analytics Aggregates]
        B2[Historical Transactions]
        B3[Vendor Data]
        B4[Product Master]
        B5[Financial Reconciliation]
    end

    RT -->|Sync via| RTSYNC["CockroachDB / Spanner\nMulti-region replication\n+ Redis CRDT cross-cloud"]
    NRT -->|Sync via| NRTSYNC["Kafka MirrorMaker 2\nCross-cloud topic replication\nExactly-once semantics"]
    BATCH -->|Sync via| BSYNC["Object Storage Replication\nS3 ↔ GCS ↔ Blob\n+ Scheduled ETL Pipelines"]

    RTSYNC --> STORE[(All Clouds Consistent)]
    NRTSYNC --> STORE
    BSYNC --> STORE

    style RT fill:#ff6b6b,color:#fff
    style NRT fill:#ffa94d,color:#fff
    style BATCH fill:#69db7c,color:#fff
    style RTSYNC fill:#339af0,color:#fff
    style NRTSYNC fill:#339af0,color:#fff
    style BSYNC fill:#339af0,color:#fff
```

## Cross-Cloud Replication Topology

```mermaid
graph LR
    subgraph AWS["AWS — Primary (us-east-1)"]
        AWS_PG["PostgreSQL / CockroachDB\n(Transactional — Write Primary)"]
        AWS_KF["Kafka Cluster\n(Event Bus — 12 brokers)"]
        AWS_S3["S3\n(Object Store)"]
        AWS_RD["Redis Cluster\n(Cache — 6 nodes)"]
    end

    subgraph GCP["GCP — Secondary (us-central1)"]
        GCP_CR["CockroachDB / Spanner\n(Transactional — Read Replica)"]
        GCP_KF["Kafka Cluster\n(Mirror — 8 brokers)"]
        GCP_GCS["GCS\n(Object Store)"]
        GCP_RD["Redis Cluster\n(Cache — 6 nodes)"]
    end

    subgraph AZ["Azure — Tertiary (eastus)"]
        AZ_PG["CockroachDB\n(Transactional — Read Replica)"]
        AZ_KF["Kafka Cluster\n(Mirror — 6 brokers)"]
        AZ_BL["Blob Storage\n(Object Store)"]
        AZ_RD["Redis Cluster\n(Cache — 4 nodes)"]
    end

    AWS_PG <-->|"Raft consensus\n~15ms RTT"| GCP_CR
    GCP_CR <-->|"Raft consensus\n~22ms RTT"| AZ_PG
    AWS_PG <-->|"Raft consensus\n~30ms RTT"| AZ_PG

    AWS_KF -->|"MirrorMaker 2\n~800ms lag"| GCP_KF
    AWS_KF -->|"MirrorMaker 2\n~1.2s lag"| AZ_KF
    GCP_KF -->|"MirrorMaker 2\n~1s lag"| AZ_KF

    AWS_S3 <-->|"CRR\n~5-15min"| GCP_GCS
    GCP_GCS <-->|"Replication\n~5-15min"| AZ_BL
    AWS_S3 <-->|"Replication\n~10-20min"| AZ_BL

    AWS_RD <-->|"CRDT Sync\n~50ms"| GCP_RD
    GCP_RD <-->|"CRDT Sync\n~65ms"| AZ_RD
    AWS_RD <-->|"CRDT Sync\n~80ms"| AZ_RD

    style AWS fill:#FF9900,color:#fff
    style GCP fill:#4285F4,color:#fff
    style AZ fill:#0078D4,color:#fff
```

## Conflict Resolution Flow

```mermaid
flowchart TD
    A[Concurrent Write Detected\nacross cloud regions] --> B{Identify Data Type}

    B -->|Cart / Session| C[CRDT Merge]
    C --> C1[G-Counter for quantities\nOR-Set for line items\nLWW-Register for metadata]
    C1 --> C2[Automatic merge — no conflict\nAll replicas converge]

    B -->|Inventory| D[Aggregate from All Sources]
    D --> D1[Sum reservations across regions\nCompare against known stock]
    D1 --> D2{Total reservations > physical stock?}
    D2 -->|Yes| D3[Reject latest reservation\nEmit stock_exceeded event\nAlert inventory ops]
    D2 -->|No| D4[Accept all reservations\nDecrement available count]

    B -->|Orders| E[Event Sourcing Replay]
    E --> E1[Collect all events from all regions\nSort by vector clock + wall clock]
    E1 --> E2[Replay events in deterministic order\nRebuild order state]
    E2 --> E3[All replicas converge\nto identical state]

    B -->|General Data| F[Last-Write-Wins\nwith Vector Clock]
    F --> F1[Compare vector clocks\nHigher clock wins]
    F1 --> F2{Concurrent / no clear winner?}
    F2 -->|Yes| F3[Use wall clock as tiebreaker\nFlag for manual review]
    F2 -->|No| F4[Accept higher vector clock write]

    C2 --> G[Log to Conflict Audit Trail]
    D3 --> G
    D4 --> G
    E3 --> G
    F3 --> G
    F4 --> G

    G --> H[(Conflict Audit Store\nRetain 90 days\nQueryable by data type / region)]

    style A fill:#e03131,color:#fff
    style C fill:#2f9e44,color:#fff
    style D fill:#e8590c,color:#fff
    style E fill:#1971c2,color:#fff
    style F fill:#6741d9,color:#fff
    style G fill:#495057,color:#fff
```

## Event-Driven Architecture

```mermaid
graph LR
    subgraph PROD["Producers"]
        P1["POS Transactions\n~2k events/sec"]
        P2["Web / Mobile Orders\n~500 events/sec"]
        P3["Inventory Updates\n~1k events/sec"]
        P4["Price Changes\n~50 events/sec"]
        P5["Customer Actions\n~3k events/sec"]
        P6["Vendor / Supplier Feeds\n~100 events/sec"]
    end

    subgraph KAFKA["Apache Kafka — Central Event Bus"]
        direction TB
        T1["retail.pos.transactions\n32 partitions — keyed by store_id"]
        T2["retail.orders.lifecycle\n16 partitions — keyed by order_id"]
        T3["retail.inventory.movements\n64 partitions — keyed by sku_id"]
        T4["retail.pricing.updates\n8 partitions — keyed by product_id"]
        T5["retail.customer.events\n32 partitions — keyed by customer_id"]
        T6["retail.catalog.changes\n8 partitions — keyed by product_id"]
    end

    subgraph CONS["Consumers"]
        C1["Inventory Service\nGroup: inventory-svc\nConsumes: T1, T2, T3"]
        C2["Analytics Pipeline\nGroup: analytics\nConsumes: ALL topics"]
        C3["Search Indexer\nGroup: search-idx\nConsumes: T3, T4, T6"]
        C4["Notification Service\nGroup: notify-svc\nConsumes: T2, T5"]
        C5["AI Agents\nGroup: ai-agents\nConsumes: T1, T2, T5"]
        C6["Audit Log\nGroup: audit\nConsumes: ALL topics"]
        C7["Cross-Cloud Mirror\nMirrorMaker 2\nConsumes: ALL topics"]
    end

    P1 --> T1
    P2 --> T2
    P3 --> T3
    P4 --> T4
    P5 --> T5
    P6 --> T6

    T1 --> C1
    T2 --> C1
    T3 --> C1
    T1 --> C2
    T2 --> C2
    T3 --> C2
    T4 --> C2
    T5 --> C2
    T6 --> C2
    T3 --> C3
    T4 --> C3
    T6 --> C3
    T2 --> C4
    T5 --> C4
    T1 --> C5
    T2 --> C5
    T5 --> C5
    T1 --> C6
    T2 --> C6
    T3 --> C6
    T4 --> C6
    T5 --> C6
    T6 --> C6
    T1 --> C7
    T2 --> C7
    T3 --> C7
    T4 --> C7
    T5 --> C7
    T6 --> C7

    style KAFKA fill:#231f20,color:#fff
    style PROD fill:#2f9e44,color:#fff
    style CONS fill:#1971c2,color:#fff
```

## Reference Tables

### Data Type Sync Matrix

| Data Type | Sync Method | Target Latency | Conflict Resolution | Partition Key |
|---|---|---|---|---|
| Cart state | CockroachDB multi-region + Redis CRDT | < 200ms | CRDT merge (OR-Set) | `customer_id` |
| Session data | Redis CRDT cross-cloud | < 100ms | CRDT merge (LWW-Register) | `session_id` |
| Auth tokens | CockroachDB multi-region | < 500ms | Last-write-wins (short TTL) | `user_id` |
| Payment transactions | CockroachDB serializable txn | < 1s | Event sourcing (strict order) | `transaction_id` |
| Inventory reservations | CockroachDB + Kafka | < 1s | Aggregate + reject overflow | `sku_id` |
| Product catalog | Kafka MirrorMaker 2 | < 10s | Last-write-wins + version vector | `product_id` |
| Inventory levels | Kafka MirrorMaker 2 | < 15s | Aggregate from all warehouses | `sku_id + location_id` |
| Customer profiles | Kafka MirrorMaker 2 | < 30s | CRDT merge (nested maps) | `customer_id` |
| Order status | Kafka MirrorMaker 2 | < 10s | Event sourcing (state machine) | `order_id` |
| Promotions | Kafka MirrorMaker 2 | < 30s | Version vector, highest wins | `promo_id` |
| Analytics aggregates | Object storage replication + ETL | 1-6 hours | Recompute from source events | Date partition |
| Historical transactions | Object storage replication | 6-24 hours | Immutable (append-only) | Date partition |
| Financial reconciliation | Scheduled ETL pipeline | Daily | Manual review + auto-match | Date partition |

### Build vs. Buy Roadmap

| Component | Phase 1 (Launch) | Phase 2 (12-18 months) | Phase 3 (24+ months) |
|---|---|---|---|
| Transactional DB | CockroachDB Cloud (managed) | Self-managed CockroachDB on K8s | Self-managed + custom replication layer |
| Event Streaming | Confluent Cloud Kafka | Self-managed Kafka on K8s | Self-managed + custom MirrorMaker config |
| Object Storage | AWS S3 + GCS + Azure Blob (native) | Same (no change needed) | Same (commodity, no advantage to build) |
| Cache Layer | Redis Cloud (managed) | Self-managed Redis + custom CRDT | Custom CRDT cache layer (if scale demands) |
| ETL Pipelines | Fivetran + dbt Cloud | Self-managed dbt + Airflow | Custom ETL framework (if needed) |
| Conflict Resolution | Application-level (custom) | Application-level (custom) | Dedicated conflict resolution service |
