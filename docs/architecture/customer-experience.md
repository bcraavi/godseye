---
sidebar_position: 6
title: Customer Experience Layer
sidebar_label: "🛍️ Customer Experience Layer"
---

# 🛍️ Customer Experience Layer

Every surface the shopper touches. All channels share a single unified session, cart, and customer profile backed by Layer 4 services. AI personalization from Layer 3 is injected at every touchpoint in real time.

---

## Unified Touchpoint Architecture

```mermaid
graph TB
    subgraph Channels["Customer Touchpoints"]
        direction LR
        WEB["Web Storefront<br/>(Next.js + Edge CDN)"]
        MOBILE["Mobile Apps<br/>(React Native)"]
        INSTORE["In-Store Systems<br/>(POS, Kiosks, Signage)"]
        CONVO["Conversational<br/>(Chat, SMS, Voice)"]
        SOCIAL["Social Commerce<br/>(IG, TikTok, Pinterest)"]
    end

    subgraph Unified["Unified Experience Layer"]
        GW["API Gateway<br/>(Layer 2: Connect)"]
        SESSION["Unified Session<br/>Manager"]
        CART["Cart Service<br/>(Tier 1)"]
        AUTH["Auth Gateway<br/>(Tier 1)"]
        PROFILE["Customer Profile<br/>(Real-Time Graph)"]
    end

    subgraph AI["AI Personalization (Layer 3)"]
        ASSISTANT["AI Shopping<br/>Assistant"]
        REC["Recommendation<br/>Engine"]
        SEARCH["Visual + Semantic<br/>Search"]
        SEGMENT["Real-Time<br/>Segmentation"]
    end

    subgraph Backend["Layer 4: Business Operations"]
        COMMERCE["Commerce Engine"]
        INVENTORY["Inventory<br/>(Real-Time ATP)"]
        OMS["Order Management"]
        PRICING["Dynamic Pricing"]
        CRM["CRM / Loyalty"]
        MARKETING["Marketing Engine"]
    end

    WEB --> GW
    MOBILE --> GW
    INSTORE --> GW
    CONVO --> GW
    SOCIAL --> GW

    GW --> SESSION
    GW --> AUTH
    SESSION --> CART
    SESSION --> PROFILE

    PROFILE --> SEGMENT
    SEGMENT --> REC
    ASSISTANT --> REC
    ASSISTANT --> SEARCH

    CART --> COMMERCE
    COMMERCE --> INVENTORY
    COMMERCE --> PRICING
    COMMERCE --> OMS
    PROFILE --> CRM
    CRM --> MARKETING

    REC --> COMMERCE
    SEARCH --> INVENTORY

    style Channels fill:#1a1a2e,color:#fff
    style Unified fill:#2c3e50,color:#fff
    style AI fill:#6c5ce7,color:#fff
    style Backend fill:#d35400,color:#fff
```

---

## Cross-Channel Customer Journey

```mermaid
sequenceDiagram
    participant CUST as Customer
    participant WEB as Web Storefront
    participant SESSION as Unified Session
    participant AI as AI Assistant
    participant MOBILE as Mobile App
    participant STORE as Physical Store
    participant POS as Nexus POS
    participant CONVO as Conversational (SMS)
    participant OMS as Order Management

    Note over CUST,OMS: Journey: Browse Web -> Continue Mobile -> Buy In-Store -> Support via SMS

    CUST->>WEB: Browse homepage (personalized via AI)
    WEB->>SESSION: Create/resume session (cookie + fingerprint)
    WEB->>AI: Request recommendations (browsing context)
    AI-->>WEB: Personalized product feed
    CUST->>WEB: Add 2 items to cart
    WEB->>SESSION: Persist cart (SKU-A, SKU-B)

    Note over CUST,MOBILE: Channel switch: Web -> Mobile

    CUST->>MOBILE: Open app (authenticated)
    MOBILE->>SESSION: Resume session (same customer ID)
    SESSION-->>MOBILE: Cart restored (SKU-A, SKU-B)
    MOBILE->>AI: "Show me similar to SKU-A but in blue"
    AI-->>MOBILE: 3 alternatives with real-time stock
    CUST->>MOBILE: Replace SKU-A with SKU-C
    MOBILE->>SESSION: Update cart (SKU-C, SKU-B)

    Note over CUST,STORE: Channel switch: Mobile -> Store

    CUST->>STORE: Enter store (geofence triggers store mode)
    MOBILE->>MOBILE: Activate Store Mode:<br/>indoor nav, scan & go
    CUST->>MOBILE: Scan SKU-B barcode (verify in-hand)
    MOBILE->>SESSION: Confirm SKU-B (in-store pickup)
    CUST->>POS: Checkout at register
    POS->>SESSION: Retrieve cart (SKU-C ship-to-home, SKU-B in-hand)
    POS->>OMS: Create split order:<br/>SKU-C = ship-from-DC<br/>SKU-B = POS sale

    Note over CUST,CONVO: Post-purchase: SMS support

    CUST->>CONVO: "Where is my SKU-C shipment?"
    CONVO->>OMS: Query order status
    OMS-->>CONVO: In transit, ETA tomorrow
    CONVO-->>CUST: "Your order ships tomorrow. Track here: [link]"
```

---

## Web Storefront

Headless React/Next.js frontend consuming Nexus Commerce API. Edge-cached via CloudFlare + SSR for sub-second TTFB. AI Shopping Assistant embedded as persistent chat widget with full catalog access.

```mermaid
flowchart LR
    subgraph Edge["Edge Layer"]
        CDN["CloudFlare CDN<br/>+ Edge Cache"]
        WAF["WAF / DDoS<br/>(Layer 2: Shield)"]
    end

    subgraph SSR["Server-Side Rendering"]
        NEXT["Next.js<br/>(App Router + RSC)"]
        BFF["BFF API Layer<br/>(GraphQL Federation)"]
    end

    subgraph Client["Client-Side"]
        REACT["React SPA Shell"]
        AI_WIDGET["AI Shopping<br/>Assistant Widget"]
        AB["A/B Test Engine<br/>(AI-Optimized)"]
        A11Y["WCAG 2.1 AA<br/>Accessibility Layer"]
    end

    subgraph APIs["Nexus Commerce API"]
        CATALOG["Product Catalog"]
        CART_API["Cart + Checkout"]
        SEARCH_API["Search<br/>(Semantic + Faceted)"]
        INVENTORY_API["Real-Time<br/>Inventory"]
        PERSONALIZATION["Personalization<br/>API (Layer 3)"]
    end

    CDN --> NEXT
    WAF --> CDN
    NEXT --> BFF
    NEXT --> REACT
    REACT --> AI_WIDGET
    REACT --> AB
    REACT --> A11Y

    BFF --> CATALOG
    BFF --> CART_API
    BFF --> SEARCH_API
    BFF --> INVENTORY_API
    BFF --> PERSONALIZATION

    AI_WIDGET --> SEARCH_API
    AI_WIDGET --> PERSONALIZATION
    AB --> PERSONALIZATION

    style Edge fill:#e74c3c,color:#fff
    style SSR fill:#2c3e50,color:#fff
    style Client fill:#3498db,color:#fff
    style APIs fill:#27ae60,color:#fff
```

| Capability | Implementation |
|---|---|
| Framework | Next.js 14+ (App Router, React Server Components) |
| Rendering | SSR + ISR, edge-cached at 200+ PoPs |
| TTFB | < 200ms (P95), < 100ms (P50) |
| AI Assistant | Persistent chat widget, full browse/search/add-to-cart |
| Personalization | Homepage, PDP, search results, recommendations |
| Inventory | Real-time ATP on every PDP, updated via WebSocket |
| Checkout | One-click (saved payment + address), Apple Pay, Google Pay |
| Accessibility | WCAG 2.1 AA, screen reader tested, keyboard-navigable |
| A/B Testing | AI-optimized multivariate, auto-allocating traffic to winners |
| Performance Budget | LCP < 2.5s, FID < 100ms, CLS < 0.1 |

---

## Mobile App Architecture

React Native (iOS + Android) with AI assistant (voice + text + camera), barcode scanner, and a geofence-activated Store Mode.

```mermaid
flowchart TB
    subgraph App["Mobile App (React Native)"]
        direction TB
        UI["UI Layer<br/>(React Native)"]
        AI_MOBILE["AI Assistant<br/>(Voice + Text + Camera)"]
        SCANNER["Barcode / QR<br/>Scanner"]
        AR["AR Try-On<br/>Engine"]
        WALLET["Loyalty Wallet<br/>+ Digital Receipts"]
        OFFLINE["Offline Catalog<br/>(SQLite + Sync)"]
    end

    subgraph StoreMode["Store Mode (Geofence Activated)"]
        GEO["Geofence<br/>Trigger"]
        NAV["Indoor Navigation<br/>(BLE Beacons)"]
        SCANGO["Scan & Go<br/>Checkout"]
        RECEIPT["Digital<br/>Receipts"]
        PAGE["Associate<br/>Paging"]
    end

    subgraph Platform["Layer 2: Mobile Platform"]
        OTA["OTA Updates<br/>(CodePush)"]
        PUSH["Push Notifications<br/>(AI-Optimized)"]
        CRASH["Crash Monitoring<br/>(NEXUS MOBILE)"]
        ANALYTICS["App Analytics"]
    end

    subgraph Backend["Backend APIs"]
        GW_API["API Gateway"]
        SESSION_API["Session Manager"]
        COMMERCE_API["Commerce API"]
        INVENTORY_RT["Inventory<br/>(Real-Time)"]
    end

    UI --> AI_MOBILE
    UI --> SCANNER
    UI --> AR
    UI --> WALLET
    UI --> OFFLINE

    GEO -->|enter store radius| NAV
    GEO --> SCANGO
    GEO --> RECEIPT
    GEO --> PAGE
    SCANNER --> SCANGO

    App --> GW_API
    StoreMode --> GW_API
    GW_API --> SESSION_API
    GW_API --> COMMERCE_API
    GW_API --> INVENTORY_RT

    Platform --> App
    OTA --> App
    PUSH --> App
    CRASH --> App

    style App fill:#3498db,color:#fff
    style StoreMode fill:#e67e22,color:#fff
    style Platform fill:#8e44ad,color:#fff
    style Backend fill:#2c3e50,color:#fff
```

### Store Mode Flow

```mermaid
stateDiagram-v2
    [*] --> NormalMode: App launched

    NormalMode --> StoreDetected: Geofence triggered<br/>(GPS + BLE beacon)
    StoreDetected --> StoreMode: User confirms<br/>store activation

    state StoreMode {
        [*] --> StoreHome
        StoreHome --> IndoorNav: Tap "Find Product"
        StoreHome --> ScanGo: Tap "Scan & Go"
        StoreHome --> PageAssociate: Tap "Need Help"
        StoreHome --> FittingRoom: Tap "Fitting Room"

        IndoorNav --> ProductLocated: BLE triangulation<br/>+ aisle mapping
        ProductLocated --> ScanGo: Scan item barcode

        ScanGo --> CartUpdated: Item added to cart
        CartUpdated --> ScanGo: Scan another
        CartUpdated --> Checkout: Tap "Pay"
        Checkout --> DigitalReceipt: Payment processed

        PageAssociate --> AssociateEnRoute: Nearest associate<br/>notified
        AssociateEnRoute --> StoreHome: Assistance complete

        FittingRoom --> SmartMirror: Check in to room
        SmartMirror --> SizeRequest: "Bring me size M"
        SizeRequest --> AssociateEnRoute: Associate fetches
        SmartMirror --> CartUpdated: Add to cart<br/>from mirror
    }

    StoreMode --> NormalMode: Exit geofence
    DigitalReceipt --> [*]
```

---

## In-Store Systems

```mermaid
flowchart TB
    subgraph CustomerFacing["Customer-Facing"]
        POS["Nexus POS<br/>(Offline-First,<br/>72h Local Autonomy)"]
        KIOSK["Self-Checkout<br/>Kiosks"]
        PRICE_CHECK["Price Check<br/>Stations"]
        SIGNAGE["Digital Signage<br/>(AI Content)"]
        QUEUE["Queue Management<br/>Displays"]
    end

    subgraph AssociateSystems["Associate Systems"]
        TABLET["Associate Tablets<br/>(Clienteling +<br/>Endless Aisle)"]
        FITTING["Smart Mirrors<br/>(Fitting Rooms)"]
    end

    subgraph IoT["IoT Sensor Network"]
        FOOT["Foot Traffic<br/>Sensors"]
        SHELF["Smart Shelf<br/>Sensors (Weight)"]
        RFID["RFID Gates<br/>(Entry / Exit)"]
        BLE["BLE Beacons<br/>(Indoor Position)"]
    end

    subgraph StoreEdge["Store Edge Server"]
        EDGE["Edge Compute<br/>(Local K3s)"]
        SYNC["Sync Queue<br/>(Offline Buffer)"]
        LOCAL_DB["Local DB<br/>(SQLite / Postgres)"]
    end

    subgraph Cloud["Cloud Backend (Layer 4)"]
        INV_SVC["Inventory Service"]
        OMS_SVC["OMS"]
        CRM_SVC["CRM / Loyalty"]
        ANALYTICS_SVC["Analytics Pipeline"]
    end

    POS --> EDGE
    KIOSK --> EDGE
    PRICE_CHECK --> EDGE
    SIGNAGE --> EDGE
    QUEUE --> EDGE
    TABLET --> EDGE
    FITTING --> EDGE

    FOOT --> EDGE
    SHELF --> EDGE
    RFID --> EDGE
    BLE --> EDGE

    EDGE --> LOCAL_DB
    EDGE --> SYNC

    SYNC -->|online| INV_SVC
    SYNC -->|online| OMS_SVC
    SYNC -->|online| CRM_SVC
    EDGE -->|telemetry| ANALYTICS_SVC

    style CustomerFacing fill:#e74c3c,color:#fff
    style AssociateSystems fill:#3498db,color:#fff
    style IoT fill:#27ae60,color:#fff
    style StoreEdge fill:#f39c12,color:#000
    style Cloud fill:#2c3e50,color:#fff
```

| System | Details |
|---|---|
| Nexus POS | Cloud-native, offline-first. 72-hour local autonomy. Conflict-free sync (CRDTs). Unified with e-commerce cart/pricing. |
| Self-Checkout Kiosks | Touch + scan interface. Weight verification. Loss prevention integration. |
| Price Check Stations | Scan barcode, show real-time price + promotions + related items. |
| Digital Signage | AI-driven content: daypart-aware, weather-responsive, inventory-linked. |
| Associate Tablets | Clienteling (customer history + preferences), endless aisle (order out-of-stock from DC), task management. |
| Smart Mirrors | RFID-tagged garments detected on entry. Request alternate sizes. Add to cart. Outfit recommendations. |
| IoT Sensors | Foot traffic heatmaps, shelf out-of-stock detection (weight sensors), RFID shrink gates, BLE positioning. |
| Queue Management | Real-time wait estimation. Dynamic lane opening. "Queue at register 4" routing. |

---

## Conversational Commerce

```mermaid
flowchart TB
    subgraph Channels["Messaging Channels"]
        WEBCHAT["Web Chat<br/>(Embedded Widget)"]
        APPMSG["Mobile App<br/>Chat"]
        SMS["SMS / MMS"]
        WA["WhatsApp<br/>Business"]
        APPLE["Apple Messages<br/>for Business"]
        IG["Instagram DM"]
    end

    subgraph Voice["Voice Commerce"]
        ALEXA["Amazon Alexa<br/>Skill"]
        GOOG["Google Home<br/>Action"]
    end

    subgraph Video["Live Commerce"]
        LIVESHOP["Live Video<br/>Shopping"]
    end

    subgraph Orchestrator["Conversation Orchestrator"]
        NLU["NLU Pipeline<br/>(Intent + Entity)"]
        DIALOG["Dialog Manager<br/>(State Machine)"]
        AI_AGENT["AI Shopping Agent<br/>(Layer 3)"]
        HANDOFF["Human Handoff<br/>Router"]
    end

    subgraph Actions["Commerce Actions (In-Conversation)"]
        BROWSE["Browse /<br/>Search"]
        ADD_CART["Add to<br/>Cart"]
        CHECKOUT_CONV["Checkout /<br/>Pay"]
        TRACK["Order<br/>Tracking"]
        NOTIFY["Back-in-Stock<br/>Notifications"]
    end

    WEBCHAT --> NLU
    APPMSG --> NLU
    SMS --> NLU
    WA --> NLU
    APPLE --> NLU
    IG --> NLU

    ALEXA --> NLU
    GOOG --> NLU

    LIVESHOP --> AI_AGENT

    NLU --> DIALOG
    DIALOG --> AI_AGENT
    DIALOG --> HANDOFF

    AI_AGENT --> BROWSE
    AI_AGENT --> ADD_CART
    AI_AGENT --> CHECKOUT_CONV
    AI_AGENT --> TRACK
    AI_AGENT --> NOTIFY

    style Channels fill:#25d366,color:#fff
    style Voice fill:#232f3e,color:#fff
    style Video fill:#e74c3c,color:#fff
    style Orchestrator fill:#6c5ce7,color:#fff
    style Actions fill:#2c3e50,color:#fff
```

Full commerce capabilities within any conversation: browse catalog, search (text + image), add to cart, apply coupons, checkout, track orders. Proactive messaging: "Text me when back in stock" subscribes the customer to an inventory event via Layer 4.

---

## Social Commerce

```mermaid
flowchart LR
    subgraph Platforms["Social Platforms"]
        IG_SHOP["Instagram<br/>Shopping"]
        TIKTOK["TikTok<br/>Shop"]
        PINTEREST["Pinterest<br/>Buyable Pins"]
    end

    subgraph LiveEvents["Live Shopping"]
        LIVE_IG["IG Live<br/>Shopping"]
        LIVE_TT["TikTok<br/>LIVE"]
        LIVE_OWN["GodsEye<br/>Live Stream"]
    end

    subgraph CreatorTools["Influencer / UGC"]
        INFLUENCER["Influencer<br/>Dashboard"]
        UGC["UGC<br/>Aggregation"]
        AFFILIATE["Affiliate<br/>Tracking"]
    end

    subgraph SyncLayer["Real-Time Catalog Sync"]
        FEED["Product Feed<br/>Manager"]
        INVENTORY_SYNC["Inventory Sync<br/>(ATP Push)"]
        PRICE_SYNC["Price Sync<br/>(Dynamic)"]
        ORDER_SYNC["Order Ingestion<br/>(Webhook)"]
    end

    subgraph Backend_Social["Layer 4: Commerce Engine"]
        CATALOG_BE["Product Catalog"]
        INV_BE["Inventory"]
        OMS_BE["OMS"]
        CRM_BE["CRM"]
    end

    IG_SHOP --> ORDER_SYNC
    TIKTOK --> ORDER_SYNC
    PINTEREST --> ORDER_SYNC

    LIVE_IG --> ORDER_SYNC
    LIVE_TT --> ORDER_SYNC
    LIVE_OWN --> ORDER_SYNC

    INFLUENCER --> AFFILIATE
    UGC --> FEED

    FEED --> CATALOG_BE
    INVENTORY_SYNC --> INV_BE
    PRICE_SYNC --> CATALOG_BE
    ORDER_SYNC --> OMS_BE
    AFFILIATE --> CRM_BE

    CATALOG_BE --> FEED
    INV_BE --> INVENTORY_SYNC
    CATALOG_BE --> PRICE_SYNC

    style Platforms fill:#e1306c,color:#fff
    style LiveEvents fill:#fe2c55,color:#fff
    style CreatorTools fill:#e67e22,color:#fff
    style SyncLayer fill:#2c3e50,color:#fff
    style Backend_Social fill:#27ae60,color:#fff
```

---

## Omnichannel Data Flow

How customer context follows the shopper across every touchpoint. A single `customer_id` resolves to unified profile, cart, preferences, and interaction history regardless of channel.

```mermaid
flowchart TB
    subgraph Identity["Identity Resolution"]
        AUTH_ID["Authenticated<br/>(Login / JWT)"]
        DEVICE["Device<br/>Fingerprint"]
        LOYALTY["Loyalty Card<br/>/ Phone #"]
        COOKIE["Cookie /<br/>Session ID"]
    end

    subgraph Touchpoints["All Touchpoints"]
        TP_WEB["Web"]
        TP_MOBILE["Mobile"]
        TP_STORE["Store POS"]
        TP_KIOSK["Kiosk"]
        TP_CHAT["Chat / SMS"]
        TP_SOCIAL["Social"]
        TP_VOICE["Voice"]
    end

    subgraph UnifiedProfile["Unified Customer Profile (Real-Time)"]
        GRAPH["Customer Graph<br/>(Identity + Relationships)"]
        PREFS["Preferences<br/>(Size, Brand, Style)"]
        HISTORY["Interaction History<br/>(Browse, Buy, Return)"]
        CART_STATE["Cart State<br/>(Cross-Channel)"]
        LOYALTY_STATE["Loyalty Tier<br/>+ Points Balance"]
        SEGMENTS["AI Segments<br/>(Real-Time)"]
    end

    subgraph Downstream["Real-Time Consumption"]
        PERSONALIZATION_OUT["Personalization<br/>Engine"]
        MARKETING_OUT["Campaign<br/>Triggers"]
        PRICING_OUT["Dynamic<br/>Pricing"]
        ASSISTANT_OUT["AI Shopping<br/>Assistant"]
        ANALYTICS_OUT["Customer<br/>Analytics"]
    end

    AUTH_ID --> GRAPH
    DEVICE --> GRAPH
    LOYALTY --> GRAPH
    COOKIE --> GRAPH

    TP_WEB --> GRAPH
    TP_MOBILE --> GRAPH
    TP_STORE --> GRAPH
    TP_KIOSK --> GRAPH
    TP_CHAT --> GRAPH
    TP_SOCIAL --> GRAPH
    TP_VOICE --> GRAPH

    GRAPH --> PREFS
    GRAPH --> HISTORY
    GRAPH --> CART_STATE
    GRAPH --> LOYALTY_STATE
    GRAPH --> SEGMENTS

    PREFS --> PERSONALIZATION_OUT
    HISTORY --> PERSONALIZATION_OUT
    SEGMENTS --> MARKETING_OUT
    LOYALTY_STATE --> PRICING_OUT
    HISTORY --> ASSISTANT_OUT
    CART_STATE --> ASSISTANT_OUT
    SEGMENTS --> ANALYTICS_OUT
    HISTORY --> ANALYTICS_OUT

    style Identity fill:#e74c3c,color:#fff
    style Touchpoints fill:#3498db,color:#fff
    style UnifiedProfile fill:#2c3e50,color:#fff
    style Downstream fill:#27ae60,color:#fff
```

### Event Flow Per Interaction

```mermaid
sequenceDiagram
    participant TP as Any Touchpoint
    participant GW as API Gateway
    participant SESSION as Session Manager
    participant PROFILE as Customer Profile Service
    participant EVENT as Event Bus (Kafka)
    participant AI as Layer 3: AI Engine
    participant L4 as Layer 4: Business Ops

    TP->>GW: Customer action (browse / cart / purchase)
    GW->>SESSION: Resolve session + identity
    SESSION->>PROFILE: Enrich with customer context
    PROFILE-->>SESSION: Profile (prefs, history, segments, cart)
    SESSION-->>GW: Enriched context
    GW->>L4: Execute business action (with context)
    L4-->>GW: Result (product data, order confirmation, etc.)
    GW-->>TP: Response (personalized)

    par Async Events
        GW->>EVENT: Emit interaction event
        EVENT->>AI: Update customer model
        EVENT->>PROFILE: Append to interaction history
        EVENT->>L4: Trigger downstream (loyalty points, campaign, etc.)
    end
```

---

## Channel Capability Matrix

| Capability | Web | Mobile | POS | Kiosk | Chat/SMS | Voice | Social |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Browse catalog | Yes | Yes | -- | Yes | Yes | Yes | Yes |
| Search (text) | Yes | Yes | -- | Yes | Yes | Yes | -- |
| Search (visual / camera) | -- | Yes | -- | -- | Yes | -- | -- |
| AI assistant | Yes | Yes | -- | -- | Yes | Yes | -- |
| Add to cart | Yes | Yes | Yes | -- | Yes | Yes | Yes |
| Checkout | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Real-time inventory | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Loyalty / rewards | Yes | Yes | Yes | -- | Yes | -- | -- |
| Personalized recs | Yes | Yes | -- | Yes | Yes | Yes | -- |
| AR try-on | -- | Yes | -- | -- | -- | -- | -- |
| Barcode scan | -- | Yes | Yes | Yes | -- | -- | -- |
| Back-in-stock alerts | Yes | Yes | -- | -- | Yes | -- | -- |
| Digital receipts | Yes | Yes | Yes | Yes | -- | -- | -- |
| Order tracking | Yes | Yes | -- | -- | Yes | Yes | -- |
| Returns / exchanges | Yes | Yes | Yes | -- | Yes | -- | -- |
