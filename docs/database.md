# TenderHub Deployment Guide

## 1. Overview

TenderHub is deployed as a Next.js application connected to a PostgreSQL database.

Production architecture:

```text
User
  ↓
TenderHub Web Application
  ↓
Next.js
  ↓
Prisma
  ↓
PostgreSQL