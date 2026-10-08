# TenderHub Documentation

TenderHub is a procurement management platform designed to manage the complete procurement lifecycle between organizations and vendors.

The platform supports:

- Organizations and their procurement teams
- Vendors and vendor teams
- Procurement planning
- Solicitation creation and publication
- Lots and procurement requirements
- Vendor bids
- Bid documents and requirement responses
- Evaluation criteria and scoring
- Awards
- Contracts
- Contract milestones and payments
- Vendor compliance
- Notifications and notices
- Payments and subscriptions
- External integrations
- Activity tracking and audit logging

TenderHub is designed around an international procurement model, with the current production configuration focused on the United States market and USD currency.

---

## 1. Documentation Structure

### Architecture

**[`architecture.md`](./architecture.md)**

Describes the overall application architecture, major layers, domain boundaries, routing structure, and relationships between the application, business logic, database, and external services.

### Installation

**[`installation.md`](./installation.md)**

Explains how to install TenderHub locally, configure the environment, generate Prisma Client, migrate the database, seed development data, and start the development server.

### Deployment

**[`deployment.md`](./deployment.md)**

Documents production deployment, environment configuration, database deployment, application builds, security considerations, and production verification.

### Database

**[`database.md`](./database.md)**

Documents the Prisma/PostgreSQL database architecture, core models, relationships, enums, indexes, and data ownership.

---

## 2. Procurement Workflows

### Procurement Workflow

**[`procurement-workflow.md`](./procurement-workflow.md)**

Documents the organization-side procurement lifecycle:

```text
Procurement
    ↓
Solicitation
    ↓
Lots
    ↓
Requirements
    ↓
Publication
    ↓
Vendor Bids
    ↓
Evaluation
    ↓
Award
    ↓
Contract