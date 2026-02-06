---
sidebar_position: 6
sidebar_label: "🛒 Headless Commerce Engine"
---

# 🛒 Headless Commerce Engine

GodsEye Commerce is a headless API-first engine that powers every selling channel -- web, mobile, POS, social, voice, and marketplace. A single backend, many frontends.

## Commerce Architecture

```mermaid
graph TD
    subgraph CHANNELS["Selling Channels (Frontends)"]
        WEB["Web Storefront\nNext.js SSR/SSG\nEdge-rendered"]
        MOB["Mobile App\nReact Native\niOS + Android"]
        POSF["POS\nGodsEye POS (PWA)\nin-store"]
        SOC["Social Commerce\nInstagram / TikTok\nShop integrations"]
        VOICE["Voice Commerce\nAlexa / Google Assistant\nConversational"]
        MKT["Marketplaces\nAmazon / Walmart\nListing + fulfillment sync"]
    end

    subgraph API["Headless API Layer"]
        GW["API Gateway — Kong / Envoy\nRate limiting, auth, routing"]
        GQL["GraphQL Federation\n(Apollo Router)"]
        REST["REST API\n(OpenAPI 3.1)"]
    end

    subgraph SERVICES["Backend Commerce Services"]
        CAT["Product Catalog\nService"]
        SRCH["Search & Discovery\nOpenSearch + AI Re-ranking"]
        CART["Cart & Checkout\nService"]
        PRICE["Pricing Engine\nDynamic + rule-based"]
        PROMO["Promotion Engine\nCoupons, BOGO, bundles"]
        INV["Inventory Service\nReal-time ATP\nacross all locations"]
        TAX["Tax Calculation\nTaxJar / Avalara"]
        SHIP["Shipping Calculator\nEasyPost / Shippo\nMulti-carrier rate shop"]
        ORD["Order Management\nService"]
        CUST["Customer Service\nProfiles, segments, loyalty"]
        PAY["Payment Orchestrator\nStripe / Adyen / fallback"]
    end

    subgraph DATA["Data Layer"]
        CRDB["CockroachDB\n(Transactional)"]
        ES["OpenSearch\n(Search + Analytics)"]
        RD["Redis\n(Cache + Sessions)"]
        KF["Kafka\n(Event Bus)"]
        S3["Object Storage\n(Media / Assets)"]
    end

    WEB --> GW
    MOB --> GW
    POSF --> GW
    SOC --> GW
    VOICE --> GW
    MKT --> GW

    GW --> GQL
    GW --> REST

    GQL --> CAT
    GQL --> SRCH
    GQL --> CART
    GQL --> PRICE
    GQL --> PROMO
    GQL --> INV
    GQL --> ORD
    GQL --> CUST

    REST --> CAT
    REST --> SRCH
    REST --> CART
    REST --> PRICE
    REST --> PROMO
    REST --> INV
    REST --> ORD
    REST --> CUST

    CART --> TAX
    CART --> SHIP
    CART --> PAY
    CART --> PROMO

    CAT --> CRDB
    CAT --> ES
    CAT --> S3
    SRCH --> ES
    CART --> RD
    CART --> CRDB
    INV --> CRDB
    INV --> RD
    ORD --> CRDB
    ORD --> KF
    CUST --> CRDB
    PRICE --> RD
    PROMO --> RD

    style CHANNELS fill:#228be6,color:#fff
    style API fill:#495057,color:#fff
    style SERVICES fill:#2f9e44,color:#fff
    style DATA fill:#e8590c,color:#fff
```

## Checkout Flow

```mermaid
sequenceDiagram
    actor Cust as Customer
    participant FE as Frontend<br/>(Web/Mobile/POS)
    participant Cart as Cart Service
    participant Auth as Auth Service
    participant Inv as Inventory Service
    participant Ship as Shipping Calculator<br/>(EasyPost/Shippo)
    participant Tax as Tax Service<br/>(TaxJar/Avalara)
    participant Promo as Promotion Engine
    participant Pay as Payment Orchestrator
    participant Ord as Order Service
    participant Notify as Notification Service

    Cust->>FE: Add item to cart
    FE->>Cart: POST /cart/items {sku, qty}
    Cart->>Inv: Check ATP (available-to-promise)
    Inv-->>Cart: Available (reserved soft-hold 15min)
    Cart-->>FE: Cart updated {items, subtotal}

    Note over Cust,FE: Customer continues shopping...<br/>Cart persisted server-side (cross-device via customer_id)

    Cust->>FE: Proceed to checkout
    FE->>Auth: Verify session (guest or authenticated)
    Auth-->>FE: Session valid {customer_id, tier}

    Cust->>FE: Enter / select shipping address
    FE->>Ship: POST /shipping/rates {address, items, weights}
    Ship-->>FE: Rate options [{carrier, service, rate, ETA}...]
    Cust->>FE: Select shipping option

    FE->>Tax: POST /tax/calculate {items, ship_from, ship_to}
    Tax-->>FE: Tax breakdown {by_jurisdiction, total_tax}

    Cust->>FE: Apply promo code
    FE->>Promo: POST /promotions/validate {code, cart, customer}
    Promo-->>FE: Discount applied {type, amount, conditions_met}

    FE->>FE: Display order summary<br/>{items + shipping + tax - discount = total}

    Cust->>FE: Submit payment
    FE->>Pay: POST /payments/authorize {amount, method, token}
    Pay-->>FE: AUTH APPROVED {auth_code, transaction_id}

    FE->>Ord: POST /orders {cart, payment, shipping, customer}
    Ord->>Inv: Convert soft-hold to hard reservation
    Inv-->>Ord: Inventory reserved
    Ord-->>FE: Order confirmed {order_id, status: placed}

    Ord->>Notify: Emit order.placed event
    Notify-->>Cust: Confirmation email + SMS

    Note over FE,Notify: End-to-end target: < 3 seconds<br/>(payment auth is the bottleneck ~1-2s)
```

## Search & Discovery Pipeline

```mermaid
flowchart TD
    subgraph INPUT["User Input"]
        TXT["Text Query\n'blue running shoes size 10'"]
        IMG["Visual Search\nCamera / image upload"]
        BROWSE["Category Browse\nNavigation + filters"]
    end

    subgraph TEXT_PIPE["Text Search Pipeline"]
        TYPO["Typo Correction\nLevenshtein + dictionary\n'runnng' → 'running'"]
        SYN["Synonym Expansion\n'sneakers' = 'shoes' = 'trainers'"]
        TOK["Tokenize & Analyze\nStemming, stop words, n-grams"]
        OS_Q["OpenSearch Query\nBool query: must + should + filter"]
        OS_R["Raw Results\nBM25 scored"]
    end

    subgraph VIS_PIPE["Visual Search Pipeline"]
        EMBED["Image → Embedding\nGemini multimodal encoder\n512-dim vector"]
        VEC["Vector Similarity Search\nOpenSearch k-NN\nHNSW index, cosine similarity"]
        VIS_R["Visual Match Results"]
    end

    subgraph RERANK["AI Re-Ranking Layer"]
        FEAT["Feature Assembly"]
        F1["Text relevance score (BM25)"]
        F2["Personalization score\n(user history, segment, affinity)"]
        F3["Popularity score\n(views, purchases, trending)"]
        F4["Margin score\n(gross margin contribution)"]
        F5["Inventory score\n(in-stock, ATP, warehouse proximity)"]
        F6["Freshness score\n(new arrivals boosted)"]
        ML["ML Re-Ranker\nLightGBM / transformer\nTrained on click-through data"]
        RANKED["Re-Ranked Results"]
    end

    subgraph OUTPUT["Response Assembly"]
        FACET["Faceted Filters\nSize, Color, Brand, Price range\nDynamic based on results"]
        SPELL["Did you mean...?\nAlternative query suggestions"]
        REC["Related / recommended\nCross-sell candidates"]
        FINAL["Final Response\n{results, facets, suggestions, metadata}\nTarget: < 200ms p99"]
    end

    TXT --> TYPO --> SYN --> TOK --> OS_Q --> OS_R
    IMG --> EMBED --> VEC --> VIS_R

    OS_R --> FEAT
    VIS_R --> FEAT
    BROWSE --> FEAT

    FEAT --- F1
    FEAT --- F2
    FEAT --- F3
    FEAT --- F4
    FEAT --- F5
    FEAT --- F6

    FEAT --> ML --> RANKED

    RANKED --> FACET
    RANKED --> SPELL
    RANKED --> REC
    FACET --> FINAL
    SPELL --> FINAL
    REC --> FINAL

    style INPUT fill:#228be6,color:#fff
    style TEXT_PIPE fill:#1971c2,color:#fff
    style VIS_PIPE fill:#6741d9,color:#fff
    style RERANK fill:#e8590c,color:#fff
    style OUTPUT fill:#2f9e44,color:#fff
```

## Product Catalog Data Model

```mermaid
erDiagram
    PRODUCT {
        uuid id PK
        string name
        string slug
        text description
        string brand
        enum status "active/draft/archived"
        timestamp created_at
        timestamp updated_at
    }

    VARIANT {
        uuid id PK
        uuid product_id FK
        string size
        string color
        string material
        decimal weight_kg
        string dimensions
        boolean is_active
    }

    SKU {
        uuid id PK
        uuid variant_id FK
        string sku_code UK
        string upc_barcode UK
        string ean_barcode
        enum fulfillment_type "ship/pickup/digital"
    }

    INVENTORY {
        uuid id PK
        uuid sku_id FK
        uuid location_id FK
        integer qty_on_hand
        integer qty_reserved
        integer qty_available "computed: on_hand - reserved"
        integer reorder_point
        timestamp last_counted
    }

    LOCATION {
        uuid id PK
        string name
        enum type "warehouse/store/vendor"
        string address
        decimal latitude
        decimal longitude
        boolean ships_orders
        boolean allows_pickup
    }

    CATEGORY {
        uuid id PK
        uuid parent_id FK "self-referencing"
        string name
        string slug
        integer depth
        string path "materialized path"
    }

    ATTRIBUTE {
        uuid id PK
        uuid product_id FK
        string key "e.g. fabric, origin, care"
        string value
        boolean filterable
        boolean searchable
    }

    MEDIA {
        uuid id PK
        uuid product_id FK
        enum type "image/video/3d_model/document"
        string url
        string alt_text
        integer sort_order
        integer width_px
        integer height_px
    }

    PRICING {
        uuid id PK
        uuid sku_id FK
        string currency "USD/CAD/EUR..."
        decimal base_price
        decimal sale_price "nullable"
        timestamp sale_start
        timestamp sale_end
        string region "nullable — region override"
        decimal cost_price "for margin calc"
    }

    REVIEW {
        uuid id PK
        uuid product_id FK
        uuid customer_id FK
        integer rating "1-5"
        text title
        text body
        boolean verified_purchase
        enum status "pending/approved/rejected"
        timestamp created_at
    }

    PRODUCT ||--o{ VARIANT : "has many"
    VARIANT ||--o{ SKU : "has many"
    SKU ||--o{ INVENTORY : "stocked at"
    INVENTORY }o--|| LOCATION : "held in"
    PRODUCT }o--o{ CATEGORY : "belongs to (many-to-many)"
    PRODUCT ||--o{ ATTRIBUTE : "has many"
    PRODUCT ||--o{ MEDIA : "has many"
    SKU ||--o{ PRICING : "priced per region/currency"
    PRODUCT ||--o{ REVIEW : "has many"
    CATEGORY ||--o{ CATEGORY : "parent-child hierarchy"
```

## Reference Tables

### API Endpoint Summary

| Endpoint | Method | Description | Avg Response | p99 Response | Auth |
|---|---|---|---|---|---|
| `/products` | GET | List products (paginated, filtered) | 45ms | 120ms | Public |
| `/products/{id}` | GET | Single product with variants, media, pricing | 30ms | 80ms | Public |
| `/products/{id}/reviews` | GET | Paginated reviews for product | 25ms | 60ms | Public |
| `/search` | POST | Full-text + faceted search | 80ms | 200ms | Public |
| `/search/visual` | POST | Image-based visual search | 250ms | 600ms | Public |
| `/search/autocomplete` | GET | Typeahead suggestions | 15ms | 40ms | Public |
| `/cart` | GET | Retrieve current cart | 20ms | 50ms | Session |
| `/cart/items` | POST | Add item to cart | 35ms | 90ms | Session |
| `/cart/items/{id}` | PATCH | Update quantity | 25ms | 70ms | Session |
| `/cart/items/{id}` | DELETE | Remove item from cart | 20ms | 50ms | Session |
| `/checkout` | POST | Initiate checkout session | 150ms | 400ms | Authenticated |
| `/checkout/shipping-rates` | POST | Fetch multi-carrier rates | 300ms | 800ms | Authenticated |
| `/checkout/tax` | POST | Calculate tax per jurisdiction | 100ms | 250ms | Authenticated |
| `/checkout/complete` | POST | Submit order + payment auth | 1.2s | 2.8s | Authenticated |
| `/orders` | GET | List customer orders | 40ms | 100ms | Authenticated |
| `/orders/{id}` | GET | Order detail + tracking | 35ms | 90ms | Authenticated |
| `/inventory/{sku}` | GET | Real-time ATP for SKU | 15ms | 40ms | Internal |
| `/inventory/{sku}/locations` | GET | ATP by location (store/warehouse) | 25ms | 60ms | Internal |

### Build vs. Buy Roadmap

| Component | Phase 1 (Launch) | Phase 2 (12-18 months) | Phase 3 (24+ months) | Long-Term Strategy |
|---|---|---|---|---|
| Product Catalog | **GodsEye-built** | GodsEye-built | GodsEye-built | Core IP -- own forever |
| Search & Discovery | **Algolia** (managed) | Migrate to self-hosted OpenSearch + custom AI re-ranker | Full GodsEye Search with ML ranking | Own -- search quality is a differentiator |
| Cart & Checkout | **GodsEye-built** | GodsEye-built | GodsEye-built | Core IP -- own forever |
| Pricing Engine | **GodsEye-built** | GodsEye-built + ML dynamic pricing | GodsEye-built | Core IP -- competitive advantage |
| Promotion Engine | **GodsEye-built** | GodsEye-built | GodsEye-built | Core IP -- retailer customization |
| Inventory (ATP) | **GodsEye-built** | GodsEye-built | GodsEye-built | Core IP -- real-time ATP is critical |
| Tax Calculation | **TaxJar / Avalara** | TaxJar / Avalara | TaxJar / Avalara | **Keep third-party forever** -- tax law complexity not worth internalizing |
| Shipping Rates | **EasyPost / Shippo** | EasyPost / Shippo | EasyPost / Shippo | **Keep third-party forever** -- carrier integrations are commodity |
| Payment Processing | **Stripe / Adyen** | Stripe / Adyen + fallback | Multi-PSP via Payment Orchestrator | **Keep third-party** -- PCI L1 compliance not worth building |
| GraphQL Federation | **Apollo Router** (managed) | Self-hosted Apollo Router | Evaluate alternatives | Likely keep managed |
| API Gateway | **Kong Cloud** | Self-hosted Kong on K8s | Self-hosted Envoy | Migrate to self-hosted for cost/control |
| CDN / Edge | **Cloudflare** | Cloudflare + Fastly (multi-CDN) | Multi-CDN with custom routing | Keep third-party, add redundancy |
