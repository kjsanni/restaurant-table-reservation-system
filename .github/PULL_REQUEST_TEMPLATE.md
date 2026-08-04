# Pull Request

## Description

<!-- Briefly describe what this PR does and why. -->

## Type of Change

<!-- Mark the boxes that apply: -->

- [ ] **feat**: New feature
- [ ] **fix**: Bug fix
- [ ] **security**: Security hardening
- [ ] **refactor**: Code refactoring (no functional change)
- [ ] **chore**: Tooling, CI/CD, or maintenance
- [ ] **docs**: Documentation only
- [ ] **ui**: UI/UX changes

## Related Issue / Ticket

<!-- Link to issue: `Closes #123` or `Fixes #123` -->

Closes #

## Testing

- [ ] `cd back-end && npm test` — Jest suite passes
- [ ] `npm run migrate:up` — migrations apply cleanly
- [ ] `cd front-end && npm run lint` — lint passes
- [ ] `cd front-end && npm run test:unit` — unit tests pass
- [ ] `cd front-end && npm run build` — production build succeeds
- [ ] E2E / a11y / visual tests (if applicable)

## Checklist

- [ ] Commits follow conventional commit format (`feat:`, `fix:`, `security:`, etc.)
- [ ] No secrets or credentials committed
- [ ] `tenantId` columns left nullable on Reservation/Payment/Customer tables (per project constraint)
- [ ] New salon components use `var(--brand-500)` / `var(--accent-500)` CSS variables, not hardcoded hex
- [ ] RBAC changes validated against `.kilo/skills/restaurant-rbac/SKILL.md` rules
- [ ] Documentation (AGENTS.md, `Specs/`, vault) updated if this changes public APIs or architecture

## Breaking Changes

<!-- If yes, describe migration path. -->

- [ ] This PR introduces breaking changes
