# TenderHub Payments

## 1. Overview

TenderHub manages payments associated with subscriptions, application fees, refunds, and other supported payment activities.

The core payment workflow is:

```text
Payment Initiated
      ↓
Payment Created
      ↓
Checkout / Provider
      ↓
Payment Verification
      ↓
PAID / FAILED
      ↓
Business Action Completed