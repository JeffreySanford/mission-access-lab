# Mission Access Lab

A compact, interview-ready training platform that connects **Angular 22**, **Nx 23**, **Java 21 / Spring Boot 4**, **OpenFGA**, **PostgreSQL**, **Keycloak**, observability, automated tests, and CI/CD.

The core learning path is intentionally simple: a user attempts an action on a mission resource, the Spring wrapper asks OpenFGA for a fine-grained decision, the result is audited, and the Angular operations dashboard visualizes the platform response.

## Start locally

Prerequisites: Node 22+, npm 10+, Java 21, Gradle 8.14+, Docker Desktop.

```powershell
npm install
cd apps/authorization-wrapper
gradle wrapper --gradle-version 8.14.3
cd ../..
npm run infra:up
npm run fga:bootstrap
# Set OPENFGA_STORE_ID and OPENFGA_MODEL_ID printed above
npm run start
```

Open the portal at `http://localhost:4200`, OpenFGA Playground at `http://localhost:3000`, API health at `http://localhost:8080/actuator/health`, and Keycloak at `http://localhost:8081`.

## What to examine first

1. [`docs/skills-gap-and-code-map.md`](docs/skills-gap-and-code-map.md) — candid practice priorities tied to code.
2. [`docs/architecture.md`](docs/architecture.md) — complete request flow and system boundaries.
3. [`apps/access-portal/src/app/features/operations`](apps/access-portal/src/app/features/operations) — animated operational dashboard.
4. [`apps/authorization-wrapper/src/main/java`](apps/authorization-wrapper/src/main/java) — Java wrapper and ports/adapters structure.
5. [`authorization/model.fga`](authorization/model.fga) — Zanzibar-inspired relationship model.

## Important note about the generated archive

The standard Gradle wrapper JAR is binary and was not available in the generation environment. Run the one-time `gradle wrapper` command above; after that, commit `gradle-wrapper.jar` and use `./gradlew` normally.
