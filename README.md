# Mission Access Lab

A compact, interview-ready training platform that connects **Angular 22**, **Nx 23**, **Java 21 / Spring Boot 4**, **OpenFGA**, **PostgreSQL**, **Keycloak**, observability, automated tests, and CI/CD.

The core learning path is intentionally simple: a user attempts an action on a mission resource, the Spring wrapper asks OpenFGA for a fine-grained decision, the result is audited, and the Angular operations dashboard visualizes the platform response.

## Start locally

Prerequisites: Node 22.13+, pnpm 11, Java 21, and Docker Desktop. The checked-in `.npmrc` overrides stale user-level corporate registries for this project. The Gradle wrapper downloads its pinned wrapper JAR on first use.

```powershell
corepack enable
corepack prepare pnpm@11.15.1 --activate
pnpm config get registry
pnpm install
pnpm infra:up
pnpm fga:bootstrap
# Set OPENFGA_STORE_ID and OPENFGA_MODEL_ID printed above
pnpm start
```

Open the portal at `http://localhost:4200`, OpenFGA Playground at `http://localhost:3000`, API health at `http://localhost:8080/actuator/health`, and Keycloak at `http://localhost:8081`.

## What to examine first

1. [`docs/skills-gap-and-code-map.md`](docs/skills-gap-and-code-map.md) — candid practice priorities tied to code.
2. [`docs/architecture.md`](docs/architecture.md) — complete request flow and system boundaries.
3. [`apps/access-portal/src/app/features/operations`](apps/access-portal/src/app/features/operations) — animated operational dashboard.
4. [`apps/authorization-wrapper/src/main/java`](apps/authorization-wrapper/src/main/java) — Java wrapper and ports/adapters structure.
5. [`authorization/model.fga`](authorization/model.fga) — Zanzibar-inspired relationship model.

## Publish to GitHub

```powershell
.\tools\publish-github.ps1
```

This creates `JeffreySanford/mission-access-lab` as a public repository and pushes `main` when GitHub CLI is authenticated.
