---
sidebar_position: 5
sidebar_label: "🖥️ Point of Sale System"
---

# 🖥️ Point of Sale System

GodsEye POS is a PWA that runs on iPad, Android tablets, and Windows terminals. It operates fully offline, syncs when connected, and integrates all omnichannel workflows. This is core IP -- built in-house from day one.

## POS Architecture

```mermaid
graph TD
    subgraph DEVICE["POS Device — iPad / Android / Windows"]
        APP["GodsEye POS App\n(PWA — TypeScript + React)"]
        SW["Service Worker\nAsset caching + offline routing"]
        subgraph LOCAL["Local Cache Layer"]
            SQL["SQLite / IndexedDB"]
            SQL_P["Products & Prices\n~50k SKUs cached"]
            SQL_PR["Promotions & Rules"]
            SQL_E["Employee Auth\n(hashed credentials)"]
            SQL_Q["Offline Transaction Queue"]
            SQL_CL["Customer Loyalty Cache\nLast sync: periodic"]
        end
    end

    subgraph PERIPH["Connected Peripherals"]
        PAY["Payment Terminal\nVerifone / Ingenico / PAX\nEMV + NFC + Mag"]
        PRINT["Receipt Printer\nESC/POS over USB/BT"]
        SCAN["Barcode Scanner\nUSB HID / Camera"]
        DRAW["Cash Drawer\nTriggered by printer"]
        DISP["Customer Display\n2nd screen / pole display"]
    end

    subgraph CLOUD["GodsEye Cloud Services"]
        GW["API Gateway\n(Kong / Envoy)"]
        PYMT["Payment Orchestrator"]
        INV["Inventory Service"]
        CUST["Customer Service"]
        ORD["Order Service"]
        ANLYT["Analytics Ingest"]
        PROMO["Promotion Engine"]
    end

    APP --> SW
    SW --> SQL
    SQL --- SQL_P
    SQL --- SQL_PR
    SQL --- SQL_E
    SQL --- SQL_Q
    SQL --- SQL_CL

    APP <-->|USB / Bluetooth| PAY
    APP <-->|USB / Bluetooth| PRINT
    APP <-->|USB HID / Camera API| SCAN
    APP -->|Trigger via printer| DRAW
    APP -->|HDMI / USB| DISP

    APP <-->|"HTTPS — Online Mode"| GW
    GW --> PYMT
    GW --> INV
    GW --> CUST
    GW --> ORD
    GW --> ANLYT
    GW --> PROMO

    APP -.->|"Offline: queue locally"| SQL_Q
    SQL_Q -.->|"Online restored: flush FIFO"| GW

    style DEVICE fill:#228be6,color:#fff
    style LOCAL fill:#1971c2,color:#fff
    style PERIPH fill:#495057,color:#fff
    style CLOUD fill:#2f9e44,color:#fff
```

## Transaction Flow -- Online

```mermaid
sequenceDiagram
    actor Assoc as Associate
    participant POS as POS App
    participant Cache as Local Cache
    participant API as GodsEye API
    participant PayOrch as Payment Orchestrator
    participant PayGW as Payment Gateway<br/>(Stripe/Adyen)
    participant Inv as Inventory Service
    participant Analytics as Analytics Pipeline

    Assoc->>POS: Scan barcode / search item
    POS->>Cache: Lookup product + price
    Cache-->>POS: Cache HIT (product data)
    POS->>API: GET /products/{sku} (background freshness check)
    API-->>POS: 200 OK (confirm price current)

    Assoc->>POS: Add to cart (qty, discounts)
    POS->>API: POST /cart/items
    API-->>POS: Cart updated (server-side cart state)

    Note over Assoc,POS: Repeat scan/add for all items

    Assoc->>POS: Tender — customer pays
    POS->>POS: Calculate totals + tax
    POS->>PayOrch: POST /payments/authorize<br/>{amount, method, terminal_id}
    PayOrch->>PayGW: Forward to processor
    PayGW-->>PayOrch: AUTH APPROVED (auth_code)
    PayOrch-->>POS: 200 OK {auth_code, last4}

    POS->>API: POST /transactions<br/>{cart, payment, store, associate}
    API->>Inv: Decrement inventory (real-time)
    Inv-->>API: Inventory updated
    API-->>POS: Transaction ID confirmed

    POS->>POS: Print receipt (ESC/POS)
    POS->>Analytics: Emit transaction.completed event

    Note over POS,Analytics: End-to-end target: < 4 seconds
```

## Transaction Flow -- Offline

```mermaid
sequenceDiagram
    participant POS as POS App
    participant SW as Service Worker
    participant Cache as Local Cache<br/>(SQLite)
    participant Queue as Offline Queue
    participant API as GodsEye API
    participant PayOrch as Payment Orchestrator
    participant Inv as Inventory Service

    Note over POS,API: Internet connection lost

    POS->>SW: Health check — /api/ping
    SW-->>POS: FAIL (timeout 3s)
    POS->>POS: Switch to OFFLINE MODE<br/>Banner: "Offline — transactions queued"

    POS->>Cache: Lookup product (local)
    Cache-->>POS: Product + price from cache

    POS->>POS: Build cart locally<br/>Calculate tax from cached tax tables

    alt Card Payment
        POS->>POS: Encrypt card data (P2PE)<br/>Store encrypted payload locally
        Note over POS: PCI DSS store-and-forward<br/>Encrypted at terminal, never decrypted on device
    else Cash Payment
        POS->>POS: Record cash tendered + change
    end

    POS->>Queue: Enqueue transaction<br/>{cart, payment_encrypted, timestamp, seq_num}
    POS->>POS: Print receipt<br/>(marked "OFFLINE — pending authorization")

    Note over POS,API: Internet connection restored

    SW->>API: Health check — /api/ping
    API-->>SW: 200 OK
    POS->>POS: Switch to ONLINE MODE

    loop For each queued transaction (FIFO)
        Queue->>API: POST /transactions/offline-sync<br/>{transaction, payment_encrypted}
        API->>PayOrch: Forward stored payment for auth
        PayOrch-->>API: AUTH result
        alt Payment Approved
            API->>Inv: Decrement inventory
            Inv-->>API: Reconciled
            API-->>POS: Sync OK — transaction confirmed
        else Payment Declined
            API-->>POS: Sync FAILED — flag for manager review
            POS->>POS: Alert: "Offline txn #{id} declined"
        end
    end

    POS->>API: POST /inventory/reconcile<br/>{store_id, offline_period}
    API->>Inv: Full inventory recount reconciliation
```

## Offline Capability Stack

```mermaid
graph TD
    subgraph WORKS["Fully Functional Offline"]
        direction TB
        W1["Item Lookup & Search\n50k SKUs cached locally"]
        W2["Price Check\nCached price + tax tables"]
        W3["Employee Login\nHashed credentials stored locally"]
        W4["Card Payment\nStore-and-forward (P2PE encrypted)"]
        W5["Cash Payment\nFull cash handling + change calc"]
        W6["Returns — Limited\nRecent transactions cached\nRefund to original tender queued"]
        W7["Loyalty — Cached\nPoint balance from last sync\nNew points queued"]
        W8["Discounts & Promotions\nCached promotion rules engine"]
        W9["Receipt Printing\nFull receipt with offline indicator"]
        W10["Associate Productivity\nShift tracking, break logging"]
    end

    subgraph DEGRADED["Degraded / Unavailable Offline"]
        direction TB
        D1["Real-Time Inventory\nShows last-known count\nNo cross-store visibility"]
        D2["Online Order Lookup\nCannot query cloud orders"]
        D3["Gift Card Balance Check\nCannot validate live balance\nAccept with risk flag"]
        D4["New Promotion Activation\nCannot download new promos\nUses last-synced rules"]
        D5["Cross-Store Transfer\nRequires cloud connectivity"]
        D6["Customer Account Creation\nQueued for sync"]
        D7["Price Override Auth\nManager PIN works offline\nAudit logged on sync"]
    end

    WORKS ---|"Cache sync every 15 min\nwhen online"| SYNC["Sync Engine"]
    DEGRADED ---|"Restored on\nreconnection"| SYNC
    SYNC --> CLOUD["GodsEye Cloud"]

    style WORKS fill:#2f9e44,color:#fff
    style DEGRADED fill:#e03131,color:#fff
    style SYNC fill:#1971c2,color:#fff
```

## Omnichannel POS Workflows

```mermaid
flowchart LR
    POS["GodsEye POS\n(Associate Device)"]

    POS --> CLIENT["Clienteling"]
    CLIENT --> CLIENT_D["Pull up customer profile\nPurchase history + preferences\nAI-suggested recommendations\nWishlist access"]

    POS --> ENDLESS["Endless Aisle"]
    ENDLESS --> ENDLESS_D["Item not in store?\nSearch all warehouses + stores\nPlace order from POS\nShip to customer home\nor ship to this store"]

    POS --> BOPIS["BOPIS Pickup"]
    BOPIS --> BOPIS_D["Customer arrives\nScan order QR code\nVerify ID if required\nMark as picked up\nTrigger confirmation email"]

    POS --> SHIP["Ship-from-Store"]
    SHIP --> SHIP_D["Online order routed to store\nGenerate pick list\nAssociate picks items\nPrint shipping label\nCarrier pickup scheduled"]

    POS --> RETURNS["Omni-Returns"]
    RETURNS --> RETURNS_D["Return online order in store\nScan order barcode / QR\nInspect item condition\nProcess refund to original\ntender or store credit"]

    POS --> LOYALTY["Cross-Channel Loyalty"]
    LOYALTY --> LOYALTY_D["Unified point balance\nEarn in-store, redeem online\nTier status visible\nBirthday / VIP promotions\nReceipt shows points earned"]

    POS --> APPT["Appointments"]
    APPT --> APPT_D["View scheduled appointments\nCustomer booked online\nAssociate prepared with\nprofile + recommendations"]

    style POS fill:#228be6,color:#fff
    style CLIENT fill:#1971c2,color:#fff
    style ENDLESS fill:#1971c2,color:#fff
    style BOPIS fill:#1971c2,color:#fff
    style SHIP fill:#1971c2,color:#fff
    style RETURNS fill:#1971c2,color:#fff
    style LOYALTY fill:#1971c2,color:#fff
    style APPT fill:#1971c2,color:#fff
```

## Reference Tables

### Hardware Compatibility Matrix

| Peripheral | Protocol | Supported Models | Connection | Offline Support |
|---|---|---|---|---|
| Payment Terminal | Semi-integrated (chip+PIN) | Verifone P400, Ingenico Lane/3000, PAX A80 | USB / Ethernet / Bluetooth | Store-and-forward (P2PE) |
| Receipt Printer | ESC/POS | Epson TM-T88VI, Star TSP143IV, Bixolon SRP-350V | USB / Bluetooth / Wi-Fi | Full |
| Barcode Scanner | USB HID / Camera | Socket Mobile S740, Zebra DS2208, built-in camera | USB / Bluetooth | Full |
| Cash Drawer | DK port (printer-driven) | APG Vasario, MMF Val-u Line | Printer DK port | Full |
| Customer Display | Secondary screen | Any HDMI/USB display, pole display via serial | HDMI / USB / Serial | Full |
| Label Printer | ZPL / ESC/POS | Zebra ZD421, Brother QL-820NWB | USB / Wi-Fi / Bluetooth | Full |
| Scale | RS-232 / USB | CAS SW-1S, Avery Berkel | USB / Serial | Full |

### POS Device Requirements

| Platform | Minimum Spec | Recommended | Notes |
|---|---|---|---|
| iPad | iPad 9th gen, iPadOS 16+ | iPad 10th gen or iPad Air | Camera barcode scanning built-in |
| Android Tablet | Android 12+, 4GB RAM, ARM64 | Samsung Galaxy Tab A8 or Lenovo Tab M10 | Chrome 110+ required for PWA |
| Windows Terminal | Windows 10+, 8GB RAM, SSD | Elo I-Series, HP Engage One | Supports full USB peripheral stack |
| Linux Terminal | Ubuntu 22.04+, 4GB RAM | Custom kiosk image available | Chromium-based PWA |

### Build vs. Buy

| Component | Strategy | Rationale |
|---|---|---|
| POS Application | **GodsEye-built from Day 1** | Core IP. Omnichannel workflows and offline capability are primary differentiators. Must own completely. |
| Payment Terminals | **Third-party forever** | Hardware is commodity. Verifone/Ingenico/PAX handle PCI terminal certification. Integrate via semi-integrated protocol. |
| Payment Processing | **Third-party** (Stripe/Adyen) | Processor relationships, PCI Level 1 compliance, and fraud tooling are not worth building. Abstract behind Payment Orchestrator for portability. |
| Receipt / Label Printers | **Third-party forever** | Commodity hardware. ESC/POS and ZPL are standard protocols. |
| Barcode Scanning | **Third-party hardware**, GodsEye camera scanning | Hardware scanners are commodity. Camera-based scanning (ML barcode detection) is GodsEye-built for device flexibility. |
