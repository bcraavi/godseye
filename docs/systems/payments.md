---
sidebar_position: 2
---

# Payment Gateway Orchestrator

GodsEye payment layer: multi-gateway smart routing, PCI-DSS Level 1 tokenization, offline-capable POS, AI-driven fraud and cost optimization. All gateways remain third-party -- GodsEye never processes raw card data.

## Payment Routing Engine

```mermaid
flowchart TD
    REQ["Payment Request<br/>(amount, currency, card type,<br/>region, channel)"]
    FC["AI Fraud Check<br/>(<100ms, real-time scoring)"]
    FS{Fraud Score}
    BLOCK["BLOCK Transaction<br/>+ Alert Security Team<br/>+ Notify Customer"]
    SR["Smart Router"]

    REQ --> FC
    FC --> FS
    FS -->|"Score > Threshold"| BLOCK
    FS -->|"Score OK"| SR

    subgraph ROUTING_LOGIC["Routing Decision Factors"]
        RL1["Gateway Health<br/>(real-time latency + error rate)"]
        RL2["Cost Optimization<br/>(interchange + gateway fee)"]
        RL3["Card Type / Brand<br/>(Visa, MC, Amex, Discover)"]
        RL4["Region<br/>(domestic vs cross-border)"]
        RL5["Historical Success Rate<br/>(per gateway per card BIN)"]
    end

    SR --> ROUTING_LOGIC
    ROUTING_LOGIC --> PG

    PG["Primary Gateway<br/>(selected by Smart Router)"]
    PG --> PG_R{Response}
    PG_R -->|"Approved"| DONE["Transaction Complete<br/>Log + Receipt"]
    PG_R -->|"Declined / Timeout"| RETRY["Retry Once<br/>(same gateway, new request ID)"]
    RETRY --> RETRY_R{Response}
    RETRY_R -->|"Approved"| DONE
    RETRY_R -->|"Declined / Timeout"| SG["Route to Secondary Gateway<br/>(<2 seconds total)"]
    SG --> SG_R{Response}
    SG_R -->|"Approved"| DONE
    SG_R -->|"Declined / Timeout"| TG["Route to Tertiary Gateway"]
    TG --> TG_R{Response}
    TG_R -->|"Approved"| DONE
    TG_R -->|"All Failed"| OFFLINE["POS: Store & Forward<br/>Web: Show alt payment options"]

    subgraph GATEWAYS["Available Gateways"]
        G1["Stripe"]
        G2["Adyen"]
        G3["Square"]
        G4["Worldpay"]
        G5["Checkout.com"]
    end
```

## Payment Types

```mermaid
graph TD
    PAY["GodsEye Payment<br/>Orchestrator"]

    subgraph CARDS["Credit / Debit Cards"]
        VISA["Visa"]
        MC["Mastercard"]
        AMEX["American Express"]
        DISC["Discover / Diners"]
        PIN["PIN Debit"]
    end

    subgraph WALLETS["Digital Wallets"]
        APPLE["Apple Pay"]
        GOOGLE["Google Pay"]
        SAMSUNG["Samsung Pay"]
    end

    subgraph BNPL["Buy Now Pay Later"]
        KLARNA["Klarna"]
        AFTERPAY["Afterpay"]
        AFFIRM["Affirm"]
    end

    subgraph STORED["Stored Value"]
        GIFT["Gift Cards"]
        CREDIT["Store Credit"]
        LOYALTY["Loyalty Points<br/>Redemption"]
    end

    subgraph SPLIT["Split Tender"]
        SP1["Partial card<br/>+ gift card"]
        SP2["Partial card<br/>+ loyalty points"]
        SP3["Multiple cards"]
        SP4["Card + BNPL"]
    end

    PAY --> CARDS
    PAY --> WALLETS
    PAY --> BNPL
    PAY --> STORED
    PAY --> SPLIT

    SPLIT -.->|"combines"| CARDS
    SPLIT -.->|"combines"| STORED
    SPLIT -.->|"combines"| BNPL
```

## PCI-DSS Compliance Flow

```mermaid
flowchart TD
    subgraph ENTRY["Card Data Entry Points"]
        POS_T["POS Terminal<br/>(P2PE encrypted at hardware)"]
        WEB["Web Checkout<br/>(Stripe.js / Adyen Drop-in)"]
        MOB["Mobile App<br/>(SDK tokenization)"]
    end

    TOK["Tokenization Layer<br/>(card data --> opaque token)<br/>Card number NEVER enters GodsEye"]

    subgraph VAULT["Token Vault (Multi-Cloud)"]
        V_AWS["AWS Vault<br/>(CloudHSM-backed)"]
        V_GCP["GCP Vault<br/>(Cloud KMS-backed)"]
        V_AZ["Azure Vault<br/>(Managed HSM-backed)"]
        V_AWS <-->|"sync"| V_GCP
        V_GCP <-->|"sync"| V_AZ
    end

    GW["Payment Gateway<br/>(handles actual card data)"]
    PROC["Card Network<br/>(Visa / MC / Amex)"]

    POS_T -->|"encrypted payload"| TOK
    WEB -->|"client-side tokenized"| TOK
    MOB -->|"SDK tokenized"| TOK

    TOK --> VAULT
    VAULT -->|"token reference"| GW
    GW -->|"raw card data<br/>(gateway scope only)"| PROC
    PROC -->|"auth response"| GW
    GW -->|"result"| TOK

    subgraph SCOPE["PCI-DSS Scope"]
        S1["GodsEye: PCI-DSS Level 1<br/>SAQ D (service provider)"]
        S2["Scope minimized via:<br/>- P2PE at terminal<br/>- Client-side tokenization<br/>- No card storage<br/>- Token vault is PCI-certified"]
    end

    style TOK fill:#f96,stroke:#333,stroke-width:2px
    style VAULT fill:#ff9,stroke:#333,stroke-width:2px
```

## In-Store Payment Flow

```mermaid
sequenceDiagram
    participant CUST as Customer
    participant TERM as Payment Terminal<br/>(P2PE)
    participant POS as POS Application
    participant ORCH as Payment Orchestrator
    participant FRAUD as Fraud Engine
    participant GW as Payment Gateway
    participant NET as Card Network

    Note over CUST,NET: Online Flow
    CUST->>TERM: Tap / Insert / Swipe card
    TERM->>TERM: P2PE encrypt card data
    TERM->>POS: Encrypted payload + amount
    POS->>ORCH: Payment request<br/>(encrypted card, amount,<br/>store ID, terminal ID)
    ORCH->>FRAUD: Real-time fraud check
    FRAUD->>FRAUD: AI scoring (<100ms)<br/>velocity, geolocation,<br/>device trust, amount pattern
    FRAUD->>ORCH: Score: PASS (score=12)

    ORCH->>ORCH: Smart route selection<br/>(lowest cost + highest success)
    ORCH->>GW: Authorization request
    GW->>NET: Card authorization
    NET->>GW: Approved (auth code: 847291)
    GW->>ORCH: Approved
    ORCH->>POS: Approved + auth code
    POS->>TERM: Display APPROVED
    POS->>POS: Generate receipt<br/>(print + email + SMS)
    POS->>ORCH: Confirm transaction logged

    Note over CUST,NET: Offline Flow (Internet Down)
    CUST->>TERM: Tap / Insert / Swipe card
    TERM->>TERM: P2PE encrypt card data
    TERM->>POS: Encrypted payload + amount
    POS->>POS: Detect: NO connectivity
    POS->>POS: Local fraud rules<br/>(floor limit check, velocity,<br/>hot card list)

    alt Amount < Floor Limit ($50) AND card not on hot list
        POS->>POS: APPROVE offline<br/>(store & forward)
        POS->>TERM: Display APPROVED (OFFLINE)
        POS->>POS: Queue transaction<br/>(encrypted, signed)
    else Amount > Floor Limit OR card on hot list
        POS->>TERM: Display DECLINED<br/>(request alternate payment)
    end

    Note over CUST,NET: Reconnection
    POS->>ORCH: Batch sync queued transactions
    ORCH->>GW: Process queued authorizations
    GW->>NET: Late authorization
    NET->>GW: Approved / Declined
    GW->>ORCH: Results
    ORCH->>POS: Reconciliation report<br/>(flag any declined offline txns)
```

## AI in Payments

```mermaid
graph TD
    AI["AI / ML Payment<br/>Intelligence Layer"]

    subgraph FRAUD_AI["Fraud Scoring (<100ms)"]
        FA1["Transaction velocity analysis"]
        FA2["Geolocation anomaly detection"]
        FA3["Device trust scoring"]
        FA4["Behavioral biometrics"]
        FA5["Card BIN risk profiling"]
        FA6["Network graph analysis<br/>(linked fraud rings)"]
    end

    subgraph ROUTING_AI["Dynamic Routing Optimization"]
        RA1["Save 0.1-0.3% on<br/>processing fees"]
        RA2["Real-time gateway<br/>performance scoring"]
        RA3["Interchange optimization<br/>(card-present vs not-present)"]
        RA4["Cross-border routing<br/>optimization"]
    end

    subgraph RECOVERY_AI["Failed Payment Recovery"]
        RE1["Smart retry timing<br/>(optimal retry windows)"]
        RE2["Dunning optimization<br/>(subscription recovery)"]
        RE3["Alternative payment<br/>method suggestion"]
        RE4["Decline reason analysis<br/>+ auto-fix"]
    end

    subgraph CHARGEBACK_AI["Chargeback Prevention"]
        CB1["Pre-dispute alerts<br/>(Verifi / Ethoca)"]
        CB2["Chargeback probability<br/>scoring at auth time"]
        CB3["Auto-generate<br/>compelling evidence"]
        CB4["Pattern detection<br/>(friendly fraud)"]
    end

    subgraph ANOMALY_AI["Anomaly Detection"]
        AN1["Unusual transaction<br/>volume spikes"]
        AN2["Gateway degradation<br/>early warning"]
        AN3["Terminal compromise<br/>detection"]
        AN4["Refund abuse patterns"]
    end

    AI --> FRAUD_AI
    AI --> ROUTING_AI
    AI --> RECOVERY_AI
    AI --> CHARGEBACK_AI
    AI --> ANOMALY_AI
```

## Gateway Comparison

| Capability | Stripe | Adyen | Square | Worldpay | Checkout.com |
|---|---|---|---|---|---|
| **Card Present (POS)** | Via Terminal API | Native | Native | Native | Limited |
| **Card Not Present (Web)** | Native | Native | Native | Native | Native |
| **Apple Pay / Google Pay** | Yes | Yes | Yes | Yes | Yes |
| **BNPL Integration** | Klarna, Afterpay | Klarna, Afterpay, Affirm | Afterpay (owned) | Limited | Klarna |
| **Multi-Currency** | 135+ currencies | 150+ currencies | Limited | 120+ currencies | 150+ currencies |
| **Regions** | Global | Global | US, CA, AU, JP, UK, EU | Global | Global |
| **Interchange++** | Yes | Yes | No (flat rate) | Yes | Yes |
| **Typical Blended Rate** | 2.9% + $0.30 | 2.6% + $0.10 | 2.6% + $0.10 | 2.5% + $0.10 | 2.5% + $0.20 |
| **Tokenization Vault** | Yes (native) | Yes (native) | Yes (native) | Yes | Yes (native) |
| **Real-Time Reporting** | Yes | Yes | Yes | Delayed | Yes |
| **Primary Use in GodsEye** | E-commerce default | Enterprise / global | In-store (SMB tier) | High-volume routing | EU / UK primary |

## Build vs Buy Strategy

| Component | Phase 1 (Launch) | Phase 2 (Scale) | Long-Term |
|---|---|---|---|
| **Payment Gateways** | Stripe + Square | Add Adyen + Worldpay | All remain third-party (NEVER build own) |
| **Smart Router** | Simple rules engine | ML-based optimization | Own routing engine (core IP) |
| **Fraud Engine** | Stripe Radar + basic rules | Add Sardine / Sift | Own ML models + third-party signals |
| **Tokenization Vault** | Stripe tokens + VGS | VGS multi-gateway | Own vault (HSM-backed, multi-cloud) |
| **Chargeback Mgmt** | Manual + Stripe tools | Chargeflow / Midigator | Own system + third-party alert networks |
| **Reconciliation** | Per-gateway reports | Aggregated dashboard | Own real-time reconciliation engine |
| **POS Terminal Mgmt** | Square Terminal / Stripe Terminal | Multi-vendor support | Own terminal management platform |
