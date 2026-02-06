---
sidebar_position: 1
---

# Authentication & Identity System

GodsEye identity layer: multi-cloud active-active Keycloak federation. Four identity types, RBAC hierarchy, offline-capable POS auth. Zero-trust architecture throughout.

## Identity Architecture

```mermaid
graph TD
    KC["Keycloak Federation Cluster<br/>(Active-Active, Multi-Cloud)"]

    subgraph CID["Customer Identity"]
        C1["Email / Password<br/>(Argon2id hashing)"]
        C2["Social Login<br/>(Google, Apple, Facebook)"]
        C3["Passkeys / WebAuthn<br/>(FIDO2)"]
        C4["Guest Checkout<br/>(ephemeral session)"]
        C5["Progressive Profiling<br/>(enrich over time)"]
    end

    subgraph EID["Employee Identity"]
        E1["SSO via SAML 2.0 / OIDC"]
        E2["Role: Store Associate"]
        E3["Role: Store Manager"]
        E4["Role: Buyer / Merchandiser"]
        E5["Role: Executive"]
        E6["Role: Engineer"]
        E7["Store-Level Permissions<br/>(tenant + location scoped)"]
    end

    subgraph AID["API Identity"]
        A1["OAuth 2.0<br/>(client_credentials + auth_code)"]
        A2["mTLS<br/>(service-to-service)"]
        A3["JWT Access Token<br/>(short-lived, 15 min)"]
        A4["JWT Refresh Token<br/>(long-lived, 7 days)"]
    end

    subgraph DID["Device Identity"]
        D1["POS Terminal Attestation<br/>(hardware TPM)"]
        D2["Mobile Device Fingerprint<br/>(SDK-based)"]
        D3["IoT Sensors<br/>(X.509 cert per device)"]
    end

    CID --> KC
    EID --> KC
    AID --> KC
    DID --> KC

    KC --> TS["Token Store<br/>(Redis Cluster)"]
    KC --> UK["User Directory<br/>(PostgreSQL + LDAP sync)"]
    KC --> AL["Audit Log<br/>(immutable, append-only)"]
```

## Multi-Cloud Auth Resilience

```mermaid
graph LR
    subgraph AWS["AWS (us-east-1)"]
        KC_AWS["Keycloak Cluster<br/>3 nodes"]
        R_AWS["Redis Token Cache<br/>(ElastiCache)"]
        KC_AWS <--> R_AWS
    end

    subgraph GCP["GCP (us-central1)"]
        KC_GCP["Keycloak Cluster<br/>3 nodes"]
        R_GCP["Redis Token Cache<br/>(Memorystore)"]
        KC_GCP <--> R_GCP
    end

    subgraph AZ["Azure (East US)"]
        KC_AZ["Keycloak Cluster<br/>3 nodes"]
        R_AZ["Redis Token Cache<br/>(Azure Cache)"]
        KC_AZ <--> R_AZ
    end

    SK["Shared Signing Keys<br/>(HSM-backed, replicated<br/>via Vault Transit)"]

    KC_AWS <-->|"JDBC replication<br/>+ Infinispan"| KC_GCP
    KC_GCP <-->|"JDBC replication<br/>+ Infinispan"| KC_AZ
    KC_AWS <-->|"JDBC replication<br/>+ Infinispan"| KC_AZ

    SK --> KC_AWS
    SK --> KC_GCP
    SK --> KC_AZ

    subgraph FAILOVER["Failure Scenarios"]
        F1["AWS down --> GCP + Azure<br/>validate all tokens"]
        F2["ALL auth clusters down --><br/>cached tokens valid 4 hours"]
        F3["POS offline --> local credential<br/>cache valid 72 hours"]
    end
```

## Auth Flow - Customer

```mermaid
sequenceDiagram
    participant C as Customer Browser
    participant CDN as CDN Edge<br/>(CloudFlare)
    participant APP as Application Server
    participant KC as Keycloak Cluster
    participant R as Redis Token Cache

    C->>CDN: GET /dashboard
    CDN->>CDN: Check session cookie

    alt Valid JWT in cookie
        CDN->>CDN: Validate JWT signature<br/>(public key cached at edge)
        CDN->>APP: Forward request<br/>(JWT validated, no DB hit)
        APP->>C: Serve page
    else Expired or missing JWT
        CDN->>C: 302 Redirect to /auth/login
        C->>KC: POST /auth (email + password)
        KC->>KC: Validate credentials<br/>(Argon2id hash check)
        KC->>KC: Check MFA requirement
        KC->>R: Store session metadata
        KC->>C: Issue JWT pair<br/>(access: 15min, refresh: 7d)
        Note over KC,C: Tokens set as HTTP-only,<br/>Secure, SameSite=Strict cookies
        C->>CDN: GET /dashboard (with JWT cookie)
        CDN->>CDN: Validate JWT at edge<br/>(no DB hit)
        CDN->>APP: Forward authenticated request
        APP->>C: Serve page
    end

    Note over C,R: Refresh Flow
    C->>CDN: GET /api/data (expired access token)
    CDN->>C: 401 Token Expired
    C->>KC: POST /auth/refresh (refresh token)
    KC->>R: Validate refresh token not revoked
    KC->>C: New JWT pair (rotate both tokens)
    C->>CDN: Retry original request
```

## Auth Flow - POS Offline

```mermaid
sequenceDiagram
    participant EMP as Employee Badge
    participant POS as POS Terminal
    participant LC as Local Auth Cache<br/>(SQLite + encrypted)
    participant NET as Network Monitor
    participant KC as Keycloak API
    participant SYNC as Sync Service

    Note over EMP,KC: Normal Operation (Online)
    EMP->>POS: Tap employee badge
    POS->>KC: POST /auth/employee<br/>(badge ID + terminal attestation)
    KC->>KC: Validate badge + role + store
    KC->>POS: JWT (access: 8hr shift, refresh: 24hr)
    POS->>LC: Cache credentials + token locally<br/>(AES-256 encrypted)
    POS->>POS: Employee logged in, POS active

    Note over EMP,KC: Offline Operation
    NET->>POS: Connectivity loss detected
    POS->>POS: Switch to OFFLINE mode<br/>(visual indicator on screen)

    EMP->>POS: Tap employee badge (shift change)
    POS->>LC: Validate badge against local cache
    LC->>POS: Cached credential valid<br/>(within 72-hour window)
    POS->>POS: Employee logged in (offline)
    POS->>POS: Process transactions<br/>(queue locally, signed with device key)

    Note over EMP,KC: Reconnection
    NET->>POS: Internet restored
    POS->>SYNC: Sync queued transactions<br/>(ordered, deduplicated)
    SYNC->>KC: Re-authenticate all sessions
    KC->>POS: Fresh tokens issued
    POS->>LC: Refresh local auth cache
    POS->>POS: Resume ONLINE mode
```

## RBAC Model

```mermaid
graph TD
    PA["Platform Admin<br/>(GodsEye Engineering)"]
    TA["Tenant Admin<br/>(Retailer HQ)"]
    SM["Store Manager"]
    DM["Department Manager"]
    SA["Store Associate"]

    PA --> TA
    TA --> SM
    SM --> DM
    DM --> SA

    subgraph PERMS["Permission Matrix"]
        P1["POS Access"]
        P2["Price Override"]
        P3["Void Transaction"]
        P4["View Reports"]
        P5["Manage Inventory"]
        P6["Manage Employees"]
        P7["Configure Store Settings"]
        P8["Manage Integrations"]
        P9["View Financials"]
        P10["Platform Configuration"]
    end

    SA -.->|"granted"| P1
    DM -.->|"granted"| P1
    DM -.->|"granted"| P2
    DM -.->|"granted"| P5
    SM -.->|"granted"| P1
    SM -.->|"granted"| P2
    SM -.->|"granted"| P3
    SM -.->|"granted"| P4
    SM -.->|"granted"| P5
    SM -.->|"granted"| P6
    TA -.->|"granted"| P4
    TA -.->|"granted"| P6
    TA -.->|"granted"| P7
    TA -.->|"granted"| P8
    TA -.->|"granted"| P9
    PA -.->|"granted"| P10
    PA -.->|"granted"| P8
```

## Build vs Buy Strategy

| Component | Phase 1 (Launch) | Phase 2 (Scale) | Phase 3 (Own) |
|---|---|---|---|
| **Identity Provider** | Auth0 managed | Keycloak on K8s (managed DB) | Own Keycloak clusters, multi-cloud |
| **Token Store** | Auth0 built-in | Redis ElastiCache | Multi-cloud Redis federation |
| **MFA** | Auth0 Guardian | Auth0 + custom TOTP | Own MFA service (WebAuthn focus) |
| **User Directory** | Auth0 DB | PostgreSQL + LDAP bridge | Distributed PostgreSQL (CockroachDB) |
| **Social Login** | Auth0 connectors | Auth0 connectors | Direct OIDC integration |
| **Device Attestation** | N/A | Third-party SDK | Own attestation service |

## Token Lifecycle

| Token Type | TTL | Refresh Policy | Revocation Strategy | Storage |
|---|---|---|---|---|
| **Customer Access JWT** | 15 minutes | Silent refresh via refresh token | Revocation list in Redis (check at edge) | HTTP-only cookie |
| **Customer Refresh Token** | 7 days | Rotate on each use (one-time use) | Immediate revocation on logout/password change | HTTP-only cookie |
| **Employee Access JWT** | 8 hours (shift) | Manual refresh at shift change | Revoked on clock-out or termination | POS local store + cookie |
| **Employee Offline Cache** | 72 hours | Refreshed on reconnection | Purged on reconnection or expiry | POS SQLite (AES-256) |
| **API Client Token** | 1 hour | client_credentials re-grant | Client secret rotation, scope reduction | In-memory only |
| **Service Mesh mTLS** | 24 hours | Auto-rotated by Istio/SPIFFE | Certificate revocation via CRL | Envoy sidecar |
| **Device Certificate** | 90 days | Auto-renewed 7 days before expiry | Remote wipe triggers cert revocation | Device TPM/Secure Enclave |
