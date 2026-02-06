---
sidebar_position: 1
sidebar_label: "📐 Five-Layer Architecture"
---

# 📐 Five-Layer Architecture

## Inter-Layer Data Flow

```mermaid
flowchart TB
    subgraph L5["Layer 5: Customer Experience"]
        direction LR
        L5_Web["Web"]
        L5_Mobile["Mobile"]
        L5_Store["Store/Kiosk"]
        L5_AI["AI Shopping"]
        L5_Voice["Voice"]
        L5_Social["Social"]
    end

    subgraph L4["Layer 4: Business Operations"]
        direction LR
        L4_Commerce["Commerce"]
        L4_Inventory["Inventory"]
        L4_OMS["OMS"]
        L4_Fulfillment["Fulfillment"]
        L4_POS["POS"]
        L4_CRM["CRM"]
        L4_Pricing["Pricing"]
        L4_SC["Supply Chain"]
        L4_WF["Workforce"]
        L4_Fin["Finance"]
        L4_Mktg["Marketing"]
        L4_Vendor["Vendor Mgmt"]
    end

    subgraph L3["Layer 3: AI Engine"]
        direction LR
        L3_Cust["Customer AI"]
        L3_Ops["Operations AI"]
        L3_Biz["Business AI"]
        L3_Dev["Developer AI"]
    end

    subgraph L2["Layer 2: Engineering Platform"]
        direction LR
        L2_Portal["Portal/IDP"]
        L2_Observe["Observe"]
        L2_Respond["Respond"]
        L2_Deploy["Deploy"]
        L2_Shield["Shield"]
        L2_Flow["Flow"]
        L2_Lens["Lens"]
        L2_Mobile["Mobile Platform"]
        L2_Connect["Connect"]
        L2_Govern["Govern"]
        L2_Market["Market"]
        L2_Extend["Extend"]
    end

    subgraph L1["Layer 1: Multi-Cloud Infrastructure"]
        direction LR
        L1_AWS["AWS"]
        L1_GCP["GCP"]
        L1_Azure["Azure"]
        L1_Mesh["Critical Services Mesh"]
    end

    L5 -- "User actions, orders,\nbrowse events" --> L4
    L4 -- "Product data, prices,\nfulfillment status" --> L5
    L4 -- "Operational data,\nfeatures, feedback" --> L3
    L3 -- "Predictions, decisions,\nrecommendations" --> L4
    L3 -- "Model metrics, training\njobs, agent telemetry" --> L2
    L2 -- "Compute, storage,\ndeployment targets" --> L3
    L2 -- "Provisioning, scaling,\nnetwork policy" --> L1
    L1 -- "Resources, health,\ncost signals" --> L2

    L5 -. "Telemetry" .-> L2_Observe
    L4 -. "Telemetry" .-> L2_Observe
    L3 -. "Telemetry" .-> L2_Observe
    L1 -. "Health" .-> L2_Observe
```

---

## Layer 5: Customer Experience

Every surface the customer touches. All channels feed into a unified session backed by Layer 4 services. AI Shopping Assistant uses Layer 3 Customer AI for real-time personalization.

```mermaid
flowchart LR
    subgraph Channels
        Web["Web Storefront\n(Next.js SSR + Edge)"]
        Mobile["Mobile Apps\n(React Native)"]
        Store["Store Kiosks\n(Embedded Linux)"]
        Voice["Voice Commerce\n(NLU Pipeline)"]
        Social["Social Commerce\n(Platform SDKs)"]
    end

    subgraph AILayer["AI-Powered"]
        AIShopping["AI Shopping\nAssistant"]
        PersonalFeed["Personalized\nFeed Engine"]
        VisualSearch["Visual Search"]
    end

    subgraph Shared["Shared Services"]
        Session["Unified Session"]
        CDN["Edge CDN"]
        Auth["Auth Gateway"]
        Cart["Cart Service"]
    end

    Web --> Session
    Mobile --> Session
    Store --> Session
    Voice --> AIShopping
    Social --> Session

    AIShopping --> PersonalFeed
    AIShopping --> VisualSearch
    AIShopping --> Session

    Session --> Auth
    Session --> Cart
    Session --> CDN

    Cart -- "Add to cart / checkout" --> L4_Commerce["Layer 4:\nCommerce Engine"]
    Auth -- "Token validation" --> L2_Shield["Layer 2:\nShield"]
    CDN -- "Cache invalidation" --> L1_Edge["Layer 1:\nEdge PoPs"]
    PersonalFeed -- "Recommendations" --> L3_CustAI["Layer 3:\nCustomer AI"]
```

---

## Layer 4: Business Operations

Core transactional systems. Every component exposes gRPC + async event interfaces. POS operates in offline-first mode with 72-hour local autonomy and conflict-free sync.

```mermaid
flowchart TB
    subgraph OrderPath["Order Lifecycle"]
        Commerce["Commerce\nEngine"] --> OMS["Order Mgmt\n(OMS)"]
        OMS --> Fulfillment["Fulfillment\nOrchestrator"]
        OMS --> POS["POS\n(Offline-First)"]
        Fulfillment --> Shipping["Ship / BOPIS /\nCurbside"]
    end

    subgraph ProductPath["Product & Pricing"]
        Inventory["Inventory\nMgmt"] <--> Commerce
        Pricing["Dynamic\nPricing"] --> Commerce
        Inventory <--> SupplyChain["Supply Chain\nPlanning"]
        SupplyChain <--> VendorMgmt["Vendor\nMgmt"]
    end

    subgraph CustomerPath["Customer & Revenue"]
        CRM["CRM &\nLoyalty"] <--> Commerce
        Marketing["Marketing\nSuite"] --> CRM
        Marketing --> Commerce
    end

    subgraph BackOffice["Back Office"]
        Finance["Finance\nAP / AR / GL"] <--> Commerce
        Finance <--> VendorMgmt
        Workforce["Workforce\nMgmt"] --> POS
        Workforce --> Finance
    end

    Commerce -- "Events" --> EventBus["Event Bus\n(Layer 2: Connect)"]
    OMS -- "Events" --> EventBus
    Inventory -- "Events" --> EventBus
    POS -- "Sync queue" --> EventBus
    Finance -- "Events" --> EventBus

    EventBus -- "Feature streams" --> L3["Layer 3:\nAI Engine"]
    L3 -- "Pricing decisions" --> Pricing
    L3 -- "Demand forecasts" --> SupplyChain
    L3 -- "Churn signals" --> CRM
    L3 -- "Fraud scores" --> OMS
```

---

## Layer 3: AI Engine

Four AI domains, 20+ specialized agents. All models run on platform-managed inference clusters. Agents consume event streams from Layer 4 and push decisions back via the event bus.

```mermaid
flowchart TB
    subgraph CustomerAI["Customer AI"]
        Personalization["Personalization\nAgent"]
        ChurnPredict["Churn Prediction\nAgent"]
        Segmentation["Customer\nSegmentation"]
        NPS["NPS & Sentiment\nAnalysis"]
        RecEngine["Recommendation\nEngine"]
        VisSearch["Visual Search\nModel"]
    end

    subgraph OpsAI["Operations AI"]
        DemandForecast["Demand\nForecasting"]
        AutoReplenish["Auto-Replenishment\nAgent"]
        RouteOpt["Route\nOptimization"]
        AnomalyDetect["Anomaly\nDetection"]
        WarehouseOpt["Warehouse\nOptimization"]
    end

    subgraph BizAI["Business AI"]
        PriceOpt["Price\nOptimization"]
        FraudDetect["Fraud Detection\nAgent"]
        FinForecast["Financial\nForecasting"]
        WorkforceAI["Workforce\nScheduling AI"]
        MarketMix["Marketing Mix\nModeling"]
    end

    subgraph DevAI["Developer AI"]
        CodeReview["Code Review\nAgent"]
        IncidentAI["Incident\nResponse Agent"]
        CapacityPlan["Capacity\nPlanning"]
        TestGen["Test Generation\nAgent"]
        DocGen["Doc Generation\nAgent"]
    end

    subgraph Shared["Shared AI Infrastructure"]
        FeatureStore["Feature\nStore"]
        ModelRegistry["Model\nRegistry"]
        TrainingPipeline["Training\nPipeline"]
        InferenceCluster["Inference\nCluster (GPU)"]
        ExperimentTrack["Experiment\nTracking"]
        VectorDB["Vector\nDatabase"]
    end

    CustomerAI --> FeatureStore
    OpsAI --> FeatureStore
    BizAI --> FeatureStore
    DevAI --> ModelRegistry

    FeatureStore --> TrainingPipeline
    TrainingPipeline --> ModelRegistry
    ModelRegistry --> InferenceCluster
    VectorDB --> RecEngine
    VectorDB --> VisSearch
    ExperimentTrack --> TrainingPipeline

    InferenceCluster -- "Decisions" --> L4_Bus["Layer 4 via\nEvent Bus"]
    L4_Bus -- "Feature\nstreams" --> FeatureStore

    TrainingPipeline -- "GPU jobs" --> L2_Deploy["Layer 2:\nDeploy"]
    InferenceCluster -- "Metrics" --> L2_Observe["Layer 2:\nObserve"]
```

---

## Layer 2: Engineering Platform

Internal developer platform plus all operational tooling. Every Layer 4 and Layer 3 service is deployed, observed, secured, and governed through Layer 2 components.

```mermaid
flowchart TB
    subgraph DevEx["Developer Experience"]
        Portal["Portal / IDP\n(Service Catalog,\nScorecard, Docs)"]
        Deploy["Deploy\n(CI/CD, GitOps,\nCanary, Blue-Green)"]
        Flow["Flow\n(Workflow Engine,\nDAGs, Scheduling)"]
        Extend["Extend\n(Plugin SDK,\nMarketplace Hooks)"]
    end

    subgraph Ops["Operations"]
        Observe["Observe\n(Metrics, Logs,\nTraces, Profiling)"]
        Respond["Respond\n(Alerting, Runbooks,\nIncident Mgmt)"]
        Lens["Lens\n(Cost Analytics,\nFinOps, Budgets)"]
    end

    subgraph Security["Security & Governance"]
        Shield["Shield\n(WAF, DDoS, SAST,\nDAST, Secrets)"]
        Govern["Govern\n(IAM, RBAC, Audit,\nCompliance, SOC2)"]
    end

    subgraph Integration["Integration & Mobile"]
        Connect["Connect\n(API Gateway, Event Bus,\nETL, CDC, Webhooks)"]
        MobilePlat["Mobile Platform\n(OTA Updates, Push,\nCrash Reporting)"]
        Market["Market\n(A/B Testing,\nFeature Flags)"]
    end

    Portal --> Deploy
    Portal --> Observe
    Portal --> Shield
    Deploy --> Flow
    Observe --> Respond
    Respond --> Flow

    Shield --> Govern
    Connect --> Observe
    MobilePlat --> Deploy
    Market --> Connect
    Extend --> Connect

    Deploy -- "Infra provisioning" --> L1["Layer 1:\nMulti-Cloud"]
    Shield -- "Network policy" --> L1
    Connect -- "Cross-cloud routing" --> L1
    Observe -- "Cloud metrics" --> L1
    Lens -- "Cost APIs" --> L1

    Respond -- "Auto-remediation" --> L3_DevAI["Layer 3:\nDeveloper AI"]
    Observe -- "Anomaly data" --> L3_DevAI
```

---

## Layer 1: Multi-Cloud Infrastructure

All compute, storage, and networking. Critical Services Mesh ensures Tier 1 services remain available across all three cloud providers with automatic failover in under 30 seconds.

```mermaid
flowchart TB
    subgraph Mesh["Critical Services Mesh"]
        GlobalLB["Global Load\nBalancer"]
        ServiceMesh["Service Mesh\n(mTLS, Circuit Breakers)"]
        DNS["Multi-Cloud\nDNS (Active-Active)"]
        CertMgmt["Certificate\nManagement"]
    end

    subgraph AWS["AWS (Primary)"]
        AWS_EKS["EKS Clusters"]
        AWS_RDS["RDS / Aurora"]
        AWS_S3["S3"]
        AWS_CF["CloudFront"]
        AWS_KMS["KMS"]
        AWS_GPU["GPU Instances\n(p5 / inf2)"]
    end

    subgraph GCP["GCP (Secondary)"]
        GCP_GKE["GKE Clusters"]
        GCP_SQL["Cloud SQL"]
        GCP_GCS["GCS"]
        GCP_CDN["Cloud CDN"]
        GCP_KMS["Cloud KMS"]
        GCP_GPU["GPU Instances\n(A3 / TPU v5)"]
    end

    subgraph Azure["Azure (Tertiary)"]
        AZ_AKS["AKS Clusters"]
        AZ_SQL["Azure SQL"]
        AZ_Blob["Blob Storage"]
        AZ_FD["Front Door"]
        AZ_KV["Key Vault"]
    end

    subgraph DataLayer["Cross-Cloud Data"]
        CockroachDB["CockroachDB\n(Global SQL)"]
        Redis["Redis Cluster\n(Cross-Region)"]
        Kafka["Kafka\n(Multi-DC)"]
        ObjectSync["Object Store\nSync"]
    end

    GlobalLB --> AWS_CF
    GlobalLB --> GCP_CDN
    GlobalLB --> AZ_FD

    DNS --> GlobalLB
    ServiceMesh --> AWS_EKS
    ServiceMesh --> GCP_GKE
    ServiceMesh --> AZ_AKS

    CockroachDB --> AWS_RDS
    CockroachDB --> GCP_SQL
    CockroachDB --> AZ_SQL

    Kafka --> AWS_EKS
    Kafka --> GCP_GKE
    Redis --> AWS_EKS
    Redis --> GCP_GKE
    Redis --> AZ_AKS

    ObjectSync --> AWS_S3
    ObjectSync --> GCP_GCS
    ObjectSync --> AZ_Blob

    CertMgmt --> AWS_KMS
    CertMgmt --> GCP_KMS
    CertMgmt --> AZ_KV
```

---

## Service Classification

All 36 components are classified by availability requirements. Classification determines cloud deployment topology and failover behavior.

| Tier | SLA | Cloud Topology | Failover | Services |
|---|---|---|---|---|
| **Tier 1: Never Down** | 99.999% | All 3 clouds (active-active-active) | < 30 sec automatic | Auth, Payments, Cart, Checkout, POS, CDN, DNS, Session Mgmt |
| **Tier 2: Degrade Gracefully** | 99.99% | 2 clouds (active-passive) | < 5 min, reduced features | Inventory, Search, Customer Profiles, Pricing, AI Shopping Assistant, Fraud Detection, API Gateway, Event Bus, Observability |
| **Tier 3: Recover in Hours** | 99.9% | 1 cloud + backup | < 4 hr from backup | Merchandising, Supply Chain, Analytics, CI/CD, Finance, Workforce Mgmt, Vendor Mgmt |

### Tier Deployment Topology

```mermaid
flowchart LR
    subgraph Tier1["Tier 1: Never Down"]
        T1_Auth["Auth"]
        T1_Pay["Payments"]
        T1_Cart["Cart"]
        T1_Checkout["Checkout"]
        T1_POS["POS"]
        T1_CDN["CDN"]
        T1_DNS["DNS"]
        T1_Session["Session"]
    end

    subgraph Tier2["Tier 2: Degrade Gracefully"]
        T2_Inv["Inventory"]
        T2_Search["Search"]
        T2_CustProf["Customer Profiles"]
        T2_Price["Pricing"]
        T2_AIShopping["AI Assistant"]
        T2_Fraud["Fraud Detection"]
        T2_APIGW["API Gateway"]
        T2_Events["Event Bus"]
        T2_Obs["Observability"]
    end

    subgraph Tier3["Tier 3: Recover in Hours"]
        T3_Merch["Merchandising"]
        T3_SC["Supply Chain"]
        T3_Analytics["Analytics"]
        T3_CICD["CI/CD"]
        T3_Fin["Finance"]
        T3_WF["Workforce"]
        T3_Vendor["Vendor Mgmt"]
    end

    subgraph Clouds
        AWS["AWS"]
        GCP["GCP"]
        Azure["Azure"]
    end

    Tier1 --> AWS
    Tier1 --> GCP
    Tier1 --> Azure

    Tier2 --> AWS
    Tier2 --> GCP

    Tier3 --> AWS
```

---

## Cross-Layer Dependency Map

Each layer depends strictly on the layers below it. No upward hard dependencies. Telemetry flows bypass this rule via async event streams to Layer 2 Observe.

```mermaid
flowchart TB
    subgraph L5["Layer 5: Customer Experience"]
        L5_Channels["Web | Mobile | Store | AI | Voice | Social"]
    end

    subgraph L4["Layer 4: Business Operations"]
        L4_Order["Commerce / OMS / Fulfillment / POS"]
        L4_Product["Inventory / Pricing / Supply Chain / Vendor"]
        L4_Customer["CRM / Marketing / Workforce / Finance"]
    end

    subgraph L3["Layer 3: AI Engine"]
        L3_CustAI["Customer AI"]
        L3_OpsAI["Operations AI"]
        L3_BizAI["Business AI"]
        L3_DevAI["Developer AI"]
    end

    subgraph L2["Layer 2: Engineering Platform"]
        L2_DevEx["Portal / Deploy / Flow / Extend"]
        L2_Ops["Observe / Respond / Lens"]
        L2_Sec["Shield / Govern"]
        L2_Int["Connect / Mobile / Market"]
    end

    subgraph L1["Layer 1: Multi-Cloud Infrastructure"]
        L1_Compute["Compute (EKS / GKE / AKS)"]
        L1_Data["Data (CockroachDB / Redis / Kafka)"]
        L1_Net["Network (Mesh / DNS / CDN / LB)"]
    end

    %% Layer 5 -> Layer 4 dependencies
    L5_Channels -- "API calls:\nproduct, cart,\ncheckout, search" --> L4_Order
    L5_Channels -- "API calls:\nprices, availability" --> L4_Product
    L5_Channels -- "API calls:\nprofile, loyalty" --> L4_Customer

    %% Layer 4 -> Layer 3 dependencies
    L4_Order -- "Fraud scoring,\ndemand signals" --> L3_OpsAI
    L4_Product -- "Price optimization,\nforecast requests" --> L3_BizAI
    L4_Customer -- "Personalization,\nchurn scoring" --> L3_CustAI

    %% Layer 4 -> Layer 2 dependencies
    L4_Order -- "Events, APIs" --> L2_Int
    L4_Product -- "Events, APIs" --> L2_Int
    L4_Customer -- "Events, APIs" --> L2_Int

    %% Layer 3 -> Layer 2 dependencies
    L3_CustAI -- "Model deploy,\nGPU scheduling" --> L2_DevEx
    L3_OpsAI -- "Model deploy,\nGPU scheduling" --> L2_DevEx
    L3_BizAI -- "Model deploy,\nGPU scheduling" --> L2_DevEx
    L3_DevAI -- "Auto-remediation,\ncode review" --> L2_Ops

    %% Layer 2 -> Layer 1 dependencies
    L2_DevEx -- "K8s API,\ncontainer runtime" --> L1_Compute
    L2_Ops -- "Metrics pipeline,\nlog storage" --> L1_Data
    L2_Sec -- "Network policy,\nfirewall rules" --> L1_Net
    L2_Int -- "Service routing,\nDNS, TLS" --> L1_Net

    %% Telemetry bypass (async, non-blocking)
    L5_Channels -. "Telemetry" .-> L2_Ops
    L4_Order -. "Telemetry" .-> L2_Ops
    L3_CustAI -. "Telemetry" .-> L2_Ops
    L1_Compute -. "Health" .-> L2_Ops
```
