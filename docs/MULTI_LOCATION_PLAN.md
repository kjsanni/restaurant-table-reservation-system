---
title: Multi-Location (branchId) Support — Plan
date: 2026-07-15
status: DEFERRED (blocked: requires schema-wide migration + data scoping)
tags:
  - plan
  - backlog
  - multi-location
related:
  - "[[000-Project-Status]]"
---

# Multi-Location (`branchId`) Support — Implementation Plan

> [!warning] Status: **Deferred / Blocked**
> This is a cross-cutting change touching the core data model (reservations, payments, tables, customers, staff assignments, RBAC scoping). It must NOT be done as a quick pass — it requires a deliberate schema + query-scoping design to avoid breaking the single-location deployment.

## Scope of work (when approved)
1. **New `Restaurants`/`Branches` table** + `branchId` column on: `Reservations`, `Payments`, `Tables`, `Customers`, `Users` (staff-home branch).
2. **Migrations** seeded with a default branch for existing single-location data.
3. **Scoping layer**: every list/report/stat query filtered by the authenticated user's `branchId` (or `*` for super-admin).
4. **RBAC**: add `manage_branch` / `view_all_branches` permissions; branch switcher in UI.
5. **API**: branch context propagated via header / session; endpoints reject cross-branch access.

## Open questions
- Is multi-tenancy needed, or just multiple physical branches under one operator?
- Should reporting aggregate across branches or stay per-branch?

## Decision
Hold until product confirms the multi-tenancy model. Implementing now risks data-integrity regressions in the production single-location deployment.
