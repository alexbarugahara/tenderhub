# TenderHub

TenderHub is an international procurement management platform designed to connect organizations with vendors throughout the procurement lifecycle.

The platform supports:

- Organizations
- Vendors
- Procurements
- Solicitations
- Lots
- Requirements
- Bids
- Evaluations
- Awards
- Contracts
- Compliance
- Documents
- Notifications
- Payments
- Subscriptions
- Integrations
- Audit logging

---

## Current Market

TenderHub is currently configured for the United States market.

| Setting | Value |
|---|---|
| Country | United States |
| Country Code | US |
| Currency | US Dollar |
| Currency Code | USD |
| Currency Symbol | $ |

The application should use US/USD configuration consistently unless the product is intentionally expanded to additional jurisdictions.

---

## Core Terminology

TenderHub uses international procurement terminology.

| Legacy Term | Current Term |
|---|---|
| Supplier | Vendor |
| Tender | Solicitation |
| Application | Bid |

The current domain model is centered around:

```text
Organization
    ↓
Procurement
    ↓
Solicitation
    ↓
Lot
    ↓
Bid
    ↓
Evaluation
    ↓
Award
    ↓
Contract