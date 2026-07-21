# Troubleshooting

- **PowerShell blocks npm/pnpm scripts:** `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **`./gradlew` reports missing wrapper:** install Gradle once and run `gradle wrapper --gradle-version 8.14.3` inside the Java app.
- **Port collision:** 4200 portal, 8080 wrapper, 8081 Keycloak, 8082 OpenFGA HTTP, 8083 OpenFGA gRPC, 3000 playground, 5432 PostgreSQL.
- **OpenFGA demo decisions appear:** the wrapper does not have `OPENFGA_STORE_ID` and `OPENFGA_MODEL_ID`.
- **Model bootstrap fails:** inspect `docker compose -f infra/compose.yaml logs openfga openfga-migrate`.
- **Database validation fails:** reset local volumes with `npm run infra:reset`, then restart.
- **JWT issuer startup failure:** keep `SECURITY_ENABLED=false` until the Keycloak realm is configured.
- **Dashboard uses fallback data:** check browser network requests to `/api/operations/snapshot` and Spring logs.
