---
sidebar_position: 5
sidebar_label: "💼 Business Operations"
---

# 💼 Layer 4 — Business Operations

GodsEye replaces the patchwork of Oracle Retail, SAP, Salesforce, Manhattan, and Blue Yonder with a unified, AI-native business operations layer. 12 modules, single data model, real-time event-driven.

---

## Business Module Map

```mermaid
graph TD
    subgraph CustomerFacing["Customer-Facing"]
        COM[Commerce Engine]
        POS[Point of Sale]
        CRM[CRM / Loyalty]
        MKT[Marketing Engine]
    end

    subgraph SupplyChain["Supply Chain & Fulfillment"]
        INV[Inventory Management]
        OMS[Order Management System]
        FUL[Fulfillment Engine]
        SCM[Supply Chain Management]
        VND[Vendor Management]
    end

    subgraph BackOffice["Back Office"]
        MER[Merchandising]
        WFM[Workforce Management]
        FIN[Finance & Accounting]
    end

    COM -->|cart + checkout| OMS
    COM -->|product catalog| MER
    COM -->|customer data| CRM
    COM -->|promotions| MKT

    POS -->|transactions| FIN
    POS -->|inventory updates| INV
    POS -->|loyalty events| CRM
    POS -->|in-store orders| OMS

    CRM -->|segments| MKT
    CRM -->|lifetime value| MER
    CRM -->|loyalty tiers| COM
    CRM -->|service history| POS

    MKT -->|campaigns| COM
    MKT -->|offers| CRM
    MKT -->|attribution| FIN

    INV -->|ATP| COM
    INV -->|stock levels| POS
    INV -->|reorder triggers| SCM
    INV -->|allocation| FUL
    INV -->|shrink data| FIN

    OMS -->|fulfillment requests| FUL
    OMS -->|payment capture| FIN
    OMS -->|inventory reservations| INV
    OMS -->|status updates| COM

    FUL -->|shipping costs| FIN
    FUL -->|pick lists| WFM
    FUL -->|carrier booking| SCM
    FUL -->|inventory consumed| INV

    SCM -->|POs| VND
    SCM -->|inbound shipments| INV
    SCM -->|landed costs| FIN
    SCM -->|lead times| MER

    VND -->|catalog updates| MER
    VND -->|invoices| FIN
    VND -->|compliance| SCM
    VND -->|drop-ship| FUL

    MER -->|assortments| COM
    MER -->|planograms| POS
    MER -->|buy plans| SCM
    MER -->|pricing rules| FIN

    WFM -->|labor costs| FIN
    WFM -->|schedules| POS
    WFM -->|DC staffing| FUL

    FIN -->|budgets| MER
    FIN -->|margin targets| MER
    FIN -->|cost centers| WFM
```

---

## Order Lifecycle

```mermaid
sequenceDiagram
    participant CUST as Customer (Web/App)
    participant COM as Commerce Engine
    participant FRAUD as Fraud Detection Agent
    participant PAY as Payment Gateway
    participant INV as Inventory Service
    participant OMS as Order Management
    participant ROUTE as Fulfillment Router
    participant DC as Distribution Center
    participant STORE as Ship-from-Store
    participant BOPIS as BOPIS Station
    participant SHIP as Shipping / Carrier
    participant NOTIFY as Notification Service
    participant POST as Post-Purchase Engine

    CUST->>COM: Place order (cart → checkout)
    COM->>FRAUD: Score transaction (amount, customer, device, address)
    alt Fraud score HIGH
        FRAUD-->>COM: BLOCK — flag for manual review
        COM-->>CUST: Order held for verification
    else Fraud score OK
        FRAUD-->>COM: APPROVED
    end

    COM->>PAY: Authorize payment ($amount, card token)
    PAY-->>COM: Authorization confirmed (auth code)

    COM->>INV: Reserve inventory (SKUs, quantities)
    INV-->>COM: Reservation confirmed (reservation IDs)

    COM->>OMS: Create order (items, payment, reservation, customer)
    OMS-->>COM: Order #ORD-48291 created

    OMS->>ROUTE: Determine fulfillment strategy
    Note over ROUTE: Evaluate: cost, proximity, capacity, SLA

    alt DC Fulfillment
        ROUTE->>DC: Assign to warehouse
        DC->>DC: Pick → Pack → Label
        DC->>SHIP: Hand off to carrier
    else Ship-from-Store
        ROUTE->>STORE: Assign to nearest store with stock
        STORE->>STORE: Pick → Pack → Generate shipping label
        STORE->>SHIP: Hand off to carrier
    else BOPIS
        ROUTE->>BOPIS: Reserve at customer-selected store
        BOPIS->>BOPIS: Pick → Stage in holding area
        BOPIS->>NOTIFY: Send "Ready for Pickup" notification
        NOTIFY->>CUST: Your order is ready at Store #142
    end

    SHIP->>NOTIFY: Tracking number generated
    NOTIFY->>CUST: Shipment tracking: #TRK-9938271

    SHIP->>SHIP: In transit → Out for delivery
    SHIP->>NOTIFY: Delivered confirmation
    NOTIFY->>CUST: Your order has been delivered

    POST->>CUST: Review request (3 days post-delivery)
    POST->>CUST: Product recommendations (7 days post-delivery)
    POST->>OMS: Update order status: COMPLETE
    OMS->>INV: Release reservation → Deduct sold inventory
```

---

## Omnichannel Inventory Flow

```mermaid
flowchart TD
    subgraph Sources["Inventory Sources"]
        DC_INV[DC On-Hand]
        STORE_INV[Store On-Hand]
        TRANSIT[In-Transit / Inbound]
        VENDOR_INV[Vendor Drop-Ship Available]
    end

    subgraph Reservations["Reservations & Holds"]
        ONLINE_RES[Online Order Reservations]
        BOPIS_RES[BOPIS Reservations]
        STORE_HOLD[Store Display / Safety Stock]
        PROMO_HOLD[Promotional Pre-Allocations]
    end

    subgraph Returns["Returns Processing"]
        RET_INSPECT[Returns — Inspection Queue]
        RET_RESTOCK[Returns — Restockable]
        RET_LIQUIDATE[Returns — Liquidation / Defective]
    end

    DC_INV --> ATP_CALC
    STORE_INV --> ATP_CALC
    TRANSIT --> ATP_CALC
    VENDOR_INV --> ATP_CALC

    ONLINE_RES --> ATP_CALC
    BOPIS_RES --> ATP_CALC
    STORE_HOLD --> ATP_CALC
    PROMO_HOLD --> ATP_CALC

    RET_RESTOCK --> ATP_CALC

    ATP_CALC{{"ATP Calculation Engine\n─────────────\nATP = (DC + Store + Transit + Vendor)\n- (Online Res + BOPIS Res\n+ Store Hold + Promo Hold)\n+ Restockable Returns"}}

    ATP_CALC --> ATP_RESULT[Real-Time ATP by SKU × Location]

    ATP_RESULT --> COM_FEED[Commerce: show in-stock / out-of-stock]
    ATP_RESULT --> POS_FEED[POS: real-time floor stock]
    ATP_RESULT --> FUL_FEED[Fulfillment Router: sourcing decisions]
    ATP_RESULT --> REPLEN[Replenishment Triggers]

    REPLEN -->|below safety stock| PO_CREATE[Create Purchase Order]
    REPLEN -->|DC → Store| TRANSFER[Inter-Location Transfer]
    REPLEN -->|imbalance detected| REBALANCE[Cross-Store Rebalance]

    PO_CREATE --> TRANSIT
    TRANSFER --> TRANSIT
    REBALANCE --> TRANSIT

    RET_INSPECT -->|passes QC| RET_RESTOCK
    RET_INSPECT -->|fails QC| RET_LIQUIDATE
    RET_LIQUIDATE --> WRITE_OFF[Financial Write-Off]
```

---

## BOPIS / Ship-from-Store Decision

```mermaid
flowchart TD
    ORD[Customer Order Received] --> CHECK_INV{Check Inventory\nby Location}

    CHECK_INV -->|No stock anywhere| BACKORDER[Backorder / Notify Customer]

    CHECK_INV -->|Stock available| EVAL[Evaluate Fulfillment Options]

    EVAL --> COST_CALC[Calculate Fulfillment Cost per Option]

    COST_CALC --> DC_COST["DC Ship:\n- Warehouse pick cost\n- Carrier rate\n- Estimated transit days"]
    COST_CALC --> SFS_COST["Ship-from-Store:\n- Store pick cost (labor)\n- Last-mile carrier rate\n- Proximity savings"]
    COST_COST --> BOPIS_COST["BOPIS:\n- Store pick cost\n- No shipping cost\n- Customer drives"]

    DC_COST --> COMPARE{Compare:\nCost + Speed + Capacity}
    SFS_COST --> COMPARE
    BOPIS_COST --> COMPARE

    COMPARE -->|BOPIS: customer selected\n+ store has stock| BOPIS_PATH
    COMPARE -->|Ship-from-Store optimal\n+ store has capacity| SFS_PATH
    COMPARE -->|DC optimal\nor no store capacity| DC_PATH

    subgraph BOPIS_PATH["BOPIS Flow"]
        B1[Reserve inventory at selected store]
        B2[Generate pick list for store associate]
        B3[Associate picks + stages order]
        B4[Notify customer: Ready for Pickup]
        B5[Customer arrives → verify ID]
        B6[Hand off order → mark complete]
        B1 --> B2 --> B3 --> B4 --> B5 --> B6
    end

    subgraph SFS_PATH["Ship-from-Store Flow"]
        S1[Assign to nearest store with stock + capacity]
        S2[Check store fulfillment queue depth]
        S3{Queue depth < threshold?}
        S3 -->|Yes| S4[Generate pick list + shipping label]
        S3 -->|No: store overloaded| S5[Reassign to next-nearest store or DC]
        S4 --> S6[Associate picks + packs]
        S6 --> S7[Carrier pickup scheduled]
        S7 --> S8[Ship + track]
        S1 --> S2 --> S3
    end

    subgraph DC_PATH["DC Fulfillment Flow"]
        D1[Route to optimal DC by region]
        D2[Warehouse pick → pack → label]
        D3[Carrier handoff]
        D4[Ship + track]
        D1 --> D2 --> D3 --> D4
    end

    BOPIS_PATH --> DONE[Order Fulfilled]
    SFS_PATH --> DONE
    DC_PATH --> DONE
    S5 --> DC_PATH
```

---

## Module Replacement Mapping

| GodsEye Module | Replaces (Legacy Systems) | Key Differentiation |
|----------------|--------------------------|---------------------|
| Commerce Engine | Salesforce Commerce Cloud, SAP Commerce, Shopify Plus, Oracle ATG | Unified headless API, AI-native personalization, single data model |
| Merchandising | Oracle Retail Merchandising (RMS), SAP Retail, JDA MMS | AI-driven assortment planning, real-time margin optimization |
| Inventory Management | Oracle Retail RIB/SIM, SAP EWM, Manhattan WMOS | Real-time ATP across all channels, AI rebalancing |
| Order Management (OMS) | Sterling OMS (IBM), Manhattan OMS, Salesforce OMS, Fluent Commerce | Event-driven, sub-second routing, unified order state |
| Fulfillment Engine | Manhattan Active, Blue Yonder WMS, Körber (HighJump) | Multi-node optimization (DC + store + vendor), AI capacity planning |
| Point of Sale (POS) | Oracle Xstore, NCR Voyix, Toshiba Global Commerce | Cloud-native, offline-first, unified with e-commerce |
| CRM / Loyalty | Salesforce CRM, Oracle CX, Braze, mParticle + custom loyalty | Unified customer graph, AI churn prediction, real-time segments |
| Supply Chain Management | Blue Yonder (JDA), Kinaxis, SAP IBP, Oracle SCM Cloud | AI demand sensing, autonomous replenishment, vendor collaboration |
| Workforce Management | Kronos (UKG), Legion, Reflexis (Zebra) | AI shift optimization, demand-aligned staffing, integrated with POS |
| Finance & Accounting | SAP FICO, Oracle ERP Cloud, NetSuite | Retail-native GL, real-time margin by SKU/store/channel |
| Marketing Engine | Salesforce Marketing Cloud, Adobe Campaign, Braze, Klaviyo | AI-driven campaign optimization, unified with CRM + Commerce |
| Vendor Management | SAP Ariba, Coupa, Oracle Procurement, Bamboo Rose | AI vendor scoring, automated PO, compliance tracking |

---

## Build vs. Buy Roadmap

| Module | Phase 1: Third-Party (Initial) | Phase 2: Build Own (Target) | Migration Trigger |
|--------|-------------------------------|----------------------------|-------------------|
| Commerce Engine | Shopify Plus (headless) | GodsEye Commerce | >$500M GMV or need custom checkout |
| Merchandising | Custom + spreadsheets | GodsEye Merchandising | After core Commerce + Inventory stable |
| Inventory Management | Custom-built (priority) | GodsEye Inventory (own from Day 1) | Build immediately — foundational |
| OMS | Custom-built (priority) | GodsEye OMS (own from Day 1) | Build immediately — core differentiator |
| Fulfillment Engine | ShipBob / Shippo + custom routing | GodsEye Fulfillment | After multi-node complexity justifies it |
| POS | Square / Toast (initial) | GodsEye POS | When store count > 50 or omni features gap |
| CRM / Loyalty | Segment + Braze + custom loyalty | GodsEye CRM | When CDP cost > build cost or AI features needed |
| Supply Chain Management | Blue Yonder (demand planning) | GodsEye Supply Chain | When AI forecasting agent outperforms vendor |
| Workforce Management | UKG / Deputy | GodsEye Workforce | When AI scheduling ROI is provable |
| Finance & Accounting | NetSuite / QuickBooks Enterprise | GodsEye Finance | Last to migrate — regulatory complexity |
| Marketing Engine | Braze + Klaviyo | GodsEye Marketing | When CRM is owned + AI personalization mature |
| Vendor Management | Coupa / custom portal | GodsEye Vendor Mgmt | When vendor count > 200 or automation ROI clear |
