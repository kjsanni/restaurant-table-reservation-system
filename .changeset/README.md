# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

## Workflow

1. **When you make a change**, create a changeset describing what changed and what bump level is needed:

   ```bash
   npx changeset
   ```

   This creates a markdown file in `.changeset/` describing the change.

2. **On CI**, changesets are collected from PRs.

3. **When PRs merge to `main`**, the `release.yml` workflow picks up all accumulated changesets, determines the next version based on the highest bump level, updates the `VERSION` file, regenerates the changelog section, and creates a GitHub release.

## Bump Levels

| Type | Trigger |
|------|---------|
| **major** | Breaking change — API or data model incompatibility |
| **minor** | New feature, backward-compatible |
| **patch** | Bug fix or security patch |

## Project-Specific Notes

- The source of truth for the version is the `VERSION` file at repo root — not `npm version`. The Release Drafter workflow (see `.github/release-drafter.yml`) maps changeset tags to version bumps and updates `VERSION` accordingly.
- Backend (`back-end/package.json`) and frontend (`front-end/package.json`) should be synced to match `VERSION` on release.
- This project does **not** publish npm packages — changesets are used purely for changelog generation and `VERSION`-file bumping.
