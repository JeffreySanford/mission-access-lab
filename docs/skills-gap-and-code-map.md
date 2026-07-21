# Skills gap and code map

This is a practice map, not a criticism. Your Angular/Nx, API, testing, and architecture experience give you a strong base. The highest-value gaps for this specific Java/OpenFGA role are the areas that have been less central in your recent work.

## 1. OpenFGA and Zanzibar-style modeling — highest priority

**Why it is a gap:** You understand RBAC and API enforcement, but relationship tuples, usersets, tuple-to-userset inheritance, immutable model IDs, and `ListObjects` require deliberate practice.

**Study in this repository:**

- [`authorization/model.fga`](../authorization/model.fga): direct relations, usersets, computed relations, inheritance.
- [`authorization/model-tests.yaml`](../authorization/model-tests.yaml): positive and negative authorization assertions.
- [`tools/openfga/bootstrap.mjs`](../tools/openfga/bootstrap.mjs): store creation, model publication, tuple writes, and model pinning.
- `OpenFgaAuthorizationAdapter.check(...)`: exact wrapper-to-OpenFGA request.

**Practice change:** add `team#member` seed tuples, call `ListObjects`, and implement a conditional emergency-access relation.

## 2. Recent production-depth Java and Spring Boot — high priority

**Why it is a gap:** Your backend design knowledge is solid, but recent work has been Angular/Nest-heavy. The interview risk is fluency with current Spring configuration, transaction boundaries, records, validation, exception handling, and performance diagnostics.

**Study in this repository:**

- `AuthorizationController`: validation and HTTP boundary.
- `AuthorizationService.check(...)`: use-case, transaction, audit, telemetry.
- `AuthorizationPort`: dependency inversion.
- `OpenFgaAuthorizationAdapter`: infrastructure adapter.
- `SecurityConfiguration`: optional OAuth2 resource-server enforcement.

**Practice change:** implement typed exception translation for OpenFGA 400/404/409/429/5xx responses and add `ProblemDetail` error bodies.

## 3. Authorization performance tuning — high priority

**Why it is a gap:** General application performance is familiar, but OpenFGA-specific performance involves model complexity, graph depth, datastore indexes, connection reuse, batching, ListObjects behavior, and careful caching because stale allows can defeat revocation.

**Study in this repository:**

- `OperationsTelemetryService`: Micrometer timer/counter integration.
- `OperationsController`: read-optimized operational snapshot.
- Operations dashboard latency bars and request chart.

**Practice change:** add P50/P95/P99 timers, a timeout, retry only safe transient failures, and a load test comparing direct checks with batched checks.

## 4. Identity-provider integration — medium-high priority

**Why it is a gap:** You have SSO/Okta familiarity, but this role may probe the line between identity claims and relationship authorization.

**Study in this repository:**

- `SecurityConfiguration`: JWT resource-server setup.
- `application.yml`: issuer URI and the `SECURITY_ENABLED` switch.
- `infra/compose.yaml`: local Keycloak service.

**Practice change:** create/import a Keycloak realm and map JWT `sub` to the OpenFGA `user:<sub>` identifier. Do not convert every role claim into FGA data automatically; define the ownership boundary.

## 5. AWS implementation depth — medium priority

**Why it is a gap:** You can discuss AWS services, Docker, ECS/ECR, and infrastructure, but the description asks for core AWS proficiency and may expect concrete operational choices.

**Relevant extension points:**

- Add SQS publishing after `AuthorizationService.check(...)` for durable audit events.
- Export model versions and evidence to S3.
- Store OpenFGA credentials in Secrets Manager.
- Deploy wrapper to ECS/Fargate and database to RDS PostgreSQL.
- Send Micrometer/OTel signals to CloudWatch or an ADOT collector.

See [`aws-and-cicd-roadmap.md`](aws-and-cicd-roadmap.md).

## 6. Integration and end-to-end testing of distributed authorization — medium priority

**Why it is a gap:** You already test full-stack systems well; the new wrinkle is proving revocation, inherited relationships, model versions, and dependency failure behavior.

**Study in this repository:**

- `AuthorizationServiceTest`: Java interaction test.
- `OperationsOverviewComponent` spec: observable UI test.
- `authorization/model-tests.yaml`: policy-specific tests.

**Practice change:** use Testcontainers for PostgreSQL/OpenFGA and Playwright for a grant → allow → revoke → deny sequence.

## 7. Platform operations storytelling — lower risk, valuable differentiator

**Why it matters:** The role includes troubleshooting, documentation, support, CI/CD, and architectural discussion. The operations view turns those responsibilities into visible evidence.

**Study in this repository:**

- `OperationsOverviewComponent`: observable view model and SVG path generation.
- `operations-overview.component.html`: topology and chart semantics.
- `operations-overview.component.scss`: animations and reduced-motion support.
- `OperationsTelemetryService`: server-side source of the dashboard contract.

**Practice change:** replace simulated request history with a ring buffer of real minute buckets and replace static service health with Actuator/OpenFGA/Keycloak probes.

## Suggested learning order

1. Run and alter model tests.
2. Trace one check end to end in a debugger.
3. Add error translation and integration tests.
4. Add Keycloak identity mapping.
5. Measure/check performance.
6. Add one AWS event path and deployment diagram.
