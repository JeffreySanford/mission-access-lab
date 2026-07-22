# Next work

Tracked scope from the 2026-07-21/22 session: linting is done (see below); the rest is deliberately sequenced rather than rushed in one pass. Each section is its own multi-hour-to-multi-day slice — pick one, finish it, check it off, move to the next.

## Done

- [x] Fixed frontend ESLint (missing `@nx/eslint-plugin`, `angular-eslint`, `typescript-eslint`; bumped `@typescript-eslint` to support TS 6).
- [x] Added backend Java linting: Spotless (Google Java Format) with `spotlessCheck`/`spotlessApply`, whole codebase reformatted to a clean baseline.
- [x] Wired `pnpm lint` to cover both projects; isolated Gradle's cache locks (`GRADLE_USER_HOME`, `--project-cache-dir`) so `build`/`test`/`lint`/`clean` no longer deadlock against the live `serve` container.
- [x] Confirmed JPA usage (`AuthorizationAuditEvent` entity + `AuthorizationAuditRepository`) and DTO usage (validated Java records at the REST boundary: `CheckRequest`, `Diagnostics`, `AuthorizationDecision`).
- [x] Fixed CI (was written for npm on a pnpm repo; `./gradlew test` couldn't work since the wrapper JAR isn't checked in). Added YAML linting (`eslint-plugin-yml` + `docker compose config`) after an unquoted `postgres://` URI in a flow-style mapping broke CI's stricter Docker Compose parser — caught the exact class of bug that slipped through review.
- [x] Added `pnpm run verify:release`: a single pre-commit/pre-push gate (workspace sanity, lint, unit tests, build) with a pass/fail summary and non-zero exit on failure. E2E and Storybook report as explicitly PENDING until sections 2 and 3 below land — no false confidence, and it auto-picks them up once their Nx targets exist.

## 1. Unit tests, verbose, every aspect

Backend (`apps/authorization-wrapper`):

- [x] `AuthorizationControllerTest` (`@WebMvcTest`) — valid check request, missing/blank fields → 400, malformed JSON → 400, `/diagnostics` live vs demo mode. Surfaced two Boot 4.1/Spring 7 breaking changes along the way: Jackson 3 renamed its package from `com.fasterxml.jackson` to `tools.jackson`, and `@WebMvcTest` moved from `spring-boot-test-autoconfigure` into a dedicated `spring-boot-starter-webmvc-test` starter (added as a testImplementation dependency).
- [x] `OpenFgaAuthorizationAdapterTest` — mock `RestClient`: allow, deny, OpenFGA 5xx, OpenFGA timeout, malformed response body, demo-mode fallback when store/model unset.
- [x] `AuthorizationServiceTest` — extended: audit event persisted with the exact checked fields (via `ArgumentCaptor`), telemetry called exactly once, and adapter-failure propagation with no audit/telemetry side effects. (`@Transactional` rollback semantics need a Spring-context integration test — this is a plain POJO unit test with mocked collaborators, so the AOP proxy that would actually roll back a transaction is never in play; noted rather than faked.)
- [x] `AuthorizationAuditRepositoryTest` (`@DataJpaTest` against the `authorization_wrapper` schema) — save/find round-trip, denied decisions, unknown-ID lookup, and genuinely verified schema-qualified table access (confirmed via the generated DDL: `authorization_wrapper.authorization_audit_event`). Uses H2 with `hibernate.hbm2ddl.create_namespaces=true` rather than a Testcontainers Postgres — tried the latter first, but hit a real Docker-outside-of-Docker networking wall (Ryuk unreachable, then the spawned Postgres container itself unreachable, since our Gradle build already runs inside a container on a custom compose network while Testcontainers-spawned siblings land on the default bridge). Not worth mounting the Docker socket and fighting Docker Desktop's networking model for what H2 already verifies just as meaningfully.
- [ ] `OpenFgaProperties` binding test — env var overrides, blank vs null store/model ID handling.

Frontend (`apps/access-portal`):

- [ ] `AuthorizationPlaygroundComponent` — extend existing spec: diagnostics load success/failure, `runCheck` success/error/loading states, preset application, `OnPush` change-detection regression test (this exact bug bit us this session — assert `markForCheck` is called, not just that state mutates).
- [ ] `OperationsApiService` — polling interval, `catchError` fallback to demo snapshot, HTTP error handling.
- [ ] `OperationsOverviewComponent` — extend existing test with the `viewModel$` constructor-timing regression (also bit us this session) as an explicit case.

Edge cases worth naming explicitly rather than leaving implicit: empty user/relation/object strings, unicode in user IDs, very long object identifiers, concurrent checks for the same tuple, OpenFGA store ID present but model ID absent (and vice versa).

## 2. Storybook

- [ ] `npx storybook init` for `access-portal` (Angular builder).
- [ ] Stories for `AuthorizationPlaygroundComponent`, `OperationsOverviewComponent`, and any presentational sub-components — cover loading, empty, allow, deny, and error states via mocked `HttpClient`.
- [ ] Wire a Storybook build/serve Nx target consistent with the rest of the workspace's target naming.

## 3. E2E, verbose, every edge case

- [ ] Pick a runner (Playwright recommended — already implied by `docs/testing-strategy.md`).
- [ ] Golden paths: alice allowed, bob denied edit, carol's inherited admin edit rights, bob's inherited view via parent project, unseeded stranger denied.
- [ ] Negative space (per `docs/testing-strategy.md`, still open): OpenFGA container down, stale/wrong model ID, malformed object string, missing JWT once `SECURITY_ENABLED=true`, cross-organization access attempt, relationship revoked mid-session.
- [ ] Full stack: run against the real containerized backend (`infra:ensure` dependency already exists — reuse it), not a mocked API.

## 4. Security review

This is explicitly a training lab, not production — decide what "secure" means here before writing tests against it. Known items to evaluate:

- [ ] `SECURITY_ENABLED` defaults to `false` (`apps/authorization-wrapper/src/main/resources/application.yml`) — OAuth2 resource-server JWT checks are currently a no-op. Decide: flip the default, or document loudly that this is intentionally off for the lab.
- [ ] `infra/.env` holds real OpenFGA store/model IDs — gitignored, confirm it stays that way and add a `.env.example`.
- [ ] Dependency CVE sweep (`npm audit` / OWASP Dependency-Check for Gradle) — not yet run this session.
- [ ] CORS configuration — not yet reviewed.
- [ ] SQL injection surface — low risk (JPA/Flyway, no raw string concatenation seen), but not formally audited.
- [ ] Secrets in `infra/compose.yaml` (Postgres/Keycloak admin creds) are lab-grade plaintext by design — confirm that's acceptable and documented as such, not accidentally shipped as a "real" pattern.

## 5. RBAC vs ReBAC comparison (UI)

- [x] Added a comparison panel to the Authorization Lab page contrasting traditional role-based access control against OpenFGA's relationship-based model, using the same seeded tuples already on the page.
