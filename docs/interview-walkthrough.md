# Ten-minute interview walkthrough

1. **Problem:** centralized authentication is insufficient for resource-level mission access.
2. **Architecture:** Angular calls a Spring wrapper; the wrapper validates identity, asks OpenFGA, performs business work, and audits the decision.
3. **Model:** explain direct users, `team#member`, parent project inheritance, and organization administrators.
4. **Code:** trace `AuthorizationController` → `AuthorizationService` → `AuthorizationPort` → `OpenFgaAuthorizationAdapter`.
5. **Operations:** show the animated dashboard and connect each visualization to a troubleshooting question.
6. **Testing:** explain model assertions, Java unit tests, Angular observable tests, and the planned revocation E2E path.
7. **Performance:** discuss timeouts, connection reuse, P95/P99, model complexity, datastore tuning, and why naive decision caching is dangerous.
8. **Deployment:** explain Nx orchestration, Gradle ownership of Java, Compose locally, and ECS/RDS/SQS/Secrets Manager in AWS.
9. **Tradeoff:** one modular wrapper is appropriate for a training slice; split model management/audit workers only when operational scaling requires it.
