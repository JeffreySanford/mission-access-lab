# AWS and CI/CD roadmap

## AWS exercise

Deploy the wrapper to ECS Fargate, OpenFGA to ECS or EKS, and PostgreSQL to RDS. Put an ALB in front of the wrapper, store secrets in Secrets Manager, send relationship/audit changes through SQS, archive evidence to S3, and route OpenTelemetry through ADOT.

Avoid making AWS IAM the application authorization model. IAM protects AWS resources; OpenFGA protects application-domain objects. Document where the two policy systems meet.

## CI stages

1. Install Node and Java.
2. Cache npm, Nx, and Gradle directories.
3. Run workspace verification and lint.
4. Run Angular and Java unit tests.
5. Start OpenFGA/PostgreSQL services and run model/integration tests.
6. Build Angular and Spring artifacts.
7. Build and scan container images.
8. Publish evidence and deploy only after model tests pass.

The included workflow is intentionally a baseline; add Testcontainers/model tests once the Gradle wrapper JAR is committed.
