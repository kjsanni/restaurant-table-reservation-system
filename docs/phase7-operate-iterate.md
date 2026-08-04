# Phase 7 Operate & Iterate — Retro & DX Artifacts

## Retrospective Template

Use this after every sprint or major milestone.

**Date:** ___________
**Participants:** ___________

### What Went Well
- 
- 

### What Could Be Improved
- 
- 

### Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| | | |

### Metrics
- Backend test pass rate: ___
- Frontend build time: ___
- Open critical bugs: ___
- Deploy frequency: ___

---

## Developer Experience (DX) Audit Checklist

### API Ergonomics
- [ ] Error messages are actionable (include field, constraint, fix hint)
- [ ] API responses use consistent envelope `{ success, data, message }`
- [ ] Pagination metadata included on list endpoints
- [ ] Rate-limit headers (`X-RateLimit-*`) present on mutating routes

### Backend DX
- [ ] `npm test` runs in < 2 min locally
- [ ] `npm run migrate:up` is idempotent and safe to re-run
- [ ] Seed scripts are deterministic (`npm run seed:all`)
- [ ] Logs are structured (Winston JSON in production)

### Frontend DX
- [ ] `npm run dev` starts both backend + frontend with one command
- [ ] Hot reload works reliably
- [ ] Component stories/examples exist for shared UI
- [ ] API client types are generated or manually maintained

### Deployment DX
- [ ] One-command deploy to staging (`./deploy-staging.sh`)
- [ ] Rollback procedure documented and tested
- [ ] Environment variable checklist is up to date

---

## Document-Release Workflow

1. **Before ship** — Update `CHANGELOG.md` with user-facing changes
2. **After ship** — Bump `VERSION` and commit
3. **Post-deploy** — Verify health endpoint returns 200
4. **Weekly** — Sync key decisions to Obsidian vault (`900-Session-Summary`)
5. **Monthly** — Run DX audit checklist and update `docs/dx-audit.md`
