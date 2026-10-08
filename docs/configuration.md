# TenderHub Configuration

## 1. Overview

TenderHub configuration controls application behavior, environment settings, market configuration, authentication, database connectivity, payments, integrations, and deployment behavior.

Configuration should be centralized where practical and should not be duplicated across unrelated application files.

---

## 2. Configuration Principles

TenderHub follows these principles:

1. Environment-specific values belong in environment variables.
2. Application constants belong in configuration modules.
3. Database structure belongs to `prisma/schema.prisma`.
4. Secrets must never be hard-coded.
5. Client-side code must not expose server-only secrets.
6. Production configuration must be separated from development configuration.
7. Configuration should be validated before the application starts.
8. Unsupported countries, currencies, providers, or enum values must not be invented.
9. Configuration must remain consistent with the current Prisma schema.

---

## 3. Environment Files

Local development normally uses:

```text
.env.local