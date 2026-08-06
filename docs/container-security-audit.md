# Container Security Audit — Podman Setup

**Date:** 2026-08-04
**Scope:** `back-end/Dockerfile`, `front-end/Dockerfile`, `podman-compose.yml`
**Frameworks:** CIS Docker Benchmark v1.6.0, NIST SP 800-190

## Executive Summary

| Category | Pass | Fail | Partial |
|----------|------|------|---------|
| Image Build (CIS 4.x) | 4 | 1 | 2 |
| Container Runtime (CIS 5.x) | 2 | 6 | 0 |
| Secrets Management | 1 | 1 | 0 |
| **Overall** | **7** | **8** | **2** |

**Risk Level:** Medium — No critical container escape vectors, but runtime hardening and secrets management need improvement.

## Findings

### Critical
None.

### High
1. **Secrets passed as environment variables** (`podman-compose.yml:42-52`)
   - `JWT_SECRET`, `DB_PASSWORD`, `REDIS_HOST` passed via `environment:`
   - Visible in `podman inspect`, process lists, and crash dumps
   - **Recommendation:** Use Podman secrets or mounted env files with restricted permissions

2. **No resource limits defined** (`podman-compose.yml:35-73`)
   - No `mem_limit`, `cpus`, `pids_limit` on backend or frontend
   - Risk: single container can exhaust host resources
   - **Recommendation:** Add resource constraints to all services

### Medium
3. **No read-only root filesystem** (`podman-compose.yml`)
   - Containers run with writable root filesystem
   - **Recommendation:** Add `read_only: true` with tmpfs mounts for `/tmp` and `/var/run`

4. **No capability restrictions** (`podman-compose.yml`)
   - Default capabilities not explicitly dropped
   - **Recommendation:** Add `cap_drop: [ALL]` and `cap_add: [NET_BIND_SERVICE]` where needed

5. **No `allowPrivilegeEscalation` / `no-new-privileges`** (`podman-compose.yml`)
   - **Recommendation:** Add `security_opt: [no-new-privileges:true]` to all services

6. **No HEALTHCHECK in Dockerfiles** (`back-end/Dockerfile`, `front-end/Dockerfile`)
   - Health checks only defined in compose file
   - **Recommendation:** Add `HEALTHCHECK` instruction to both Dockerfiles for standalone use

7. **MySQL root password exposed in compose file** (`podman-compose.yml:8`)
   - `MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-secure-password}` uses same variable as app user
   - **Recommendation:** Use separate `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` variables

### Low
8. **No content trust / image signing**
   - Images built locally without Docker Content Trust or Cosign
   - **Recommendation:** Enable `DOCKER_CONTENT_TRUST=1` or sign images with Cosign

9. **Base image tags not pinned by digest**
   - `node:26-alpine`, `mysql:8.0`, `redis:7-alpine`, `nginx:alpine`
   - **Recommendation:** Pin to SHA256 digests for reproducible builds

## Compliance Matrix

| CIS Docker Benchmark | Status | Notes |
|---------------------|--------|-------|
| 4.1: Use trusted base images | ✅ Pass | Official node, nginx, mysql, redis images |
| 4.2: No secrets in Dockerfile | ✅ Pass | No hard-coded secrets |
| 4.3: COPY over ADD | ✅ Pass | Only COPY used |
| 4.4: Multi-stage builds | ✅ Pass | Both Dockerfiles use multi-stage |
| 4.5: Non-root user | ✅ Pass | `USER nodejs` / `USER nginx` |
| 4.6: HEALTHCHECK | ⚠️ Partial | In compose, not Dockerfile |
| 4.7: Content trust | ❌ Fail | Not enabled |
| 4.8: No unnecessary packages | ✅ Pass | Minimal alpine-based images |
| 5.1: No privileged containers | ✅ Pass | No `privileged: true` |
| 5.2: No Docker socket mount | ✅ Pass | No socket mounts |
| 5.3: Drop capabilities | ❌ Fail | Not configured |
| 5.4: Read-only root filesystem | ❌ Fail | Not configured |
| 5.5: Resource limits | ❌ Fail | Not configured |
| 5.6: Security options | ❌ Fail | No `no-new-privileges` |
| 5.7: Network segmentation | ❌ Fail | No network policies |

## NIST SP 800-190 Risk Categories

| Category | Risk Level | Notes |
|----------|-----------|-------|
| Image Risks | Low | Minimal base images, multi-stage builds |
| Registry Risks | Low | Local builds, no external registry push |
| Orchestrator Risks | Medium | No resource limits, no network policies |
| Container Risks | Medium | Non-root users, but no capability drops or read-only FS |
| Host OS Risks | Low | Podman rootless mode recommended |

## Recommendations

### Immediate (High Priority)
1. Move secrets to Podman secrets or mounted env files
2. Add resource limits to all services in `podman-compose.yml`
3. Add `security_opt: [no-new-privileges:true]` to all services

### Short-term (Medium Priority)
4. Add `read_only: true` with tmpfs mounts
5. Add `cap_drop: [ALL]` to all services
6. Add `HEALTHCHECK` to both Dockerfiles
7. Separate MySQL root and app passwords

### Long-term (Low Priority)
8. Pin base images to SHA256 digests
9. Enable image signing with Cosign
10. Implement network policies between services

## Files Reviewed
- `back-end/Dockerfile`
- `front-end/Dockerfile`
- `podman-compose.yml`
