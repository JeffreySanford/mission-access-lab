# Testing strategy

## Existing layers

- Angular component test verifies the operations view renders from an observable snapshot.
- Java unit test verifies authorization decisions are persisted and recorded in telemetry.
- OpenFGA model tests cover owner inheritance, viewer restrictions, and unrelated-user negative space.
- Workspace verification checks key files and JSON syntax without installing dependencies.

## Recommended next tests

1. `OpenFgaAuthorizationAdapterIntegrationTest` using an OpenFGA Testcontainer or Compose service.
2. MVC tests for request validation and 400 responses.
3. Database integration test for Flyway/JPA mapping.
4. Playwright paths: alice allowed, bob denied edit, revocation takes effect, OpenFGA outage is visible.
5. k6/Gatling profile for Check and ListObjects P50/P95/P99.
6. Contract test that a model publish does not change production traffic until the pinned model ID changes.

Negative-space tests are particularly important: unavailable OpenFGA, stale model ID, malformed object, missing JWT, cross-organization access, and a relationship revoked during an active session.
