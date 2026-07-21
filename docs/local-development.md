# Local development

## Prerequisites

- Node.js 22.13 or newer
- pnpm 11
- Java 21
- Docker Desktop

The repository includes a project-level `.npmrc` that deliberately points Angular, Nx, and TypeScript packages at the public npm registry. This prevents an old user-level corporate registry from breaking this project.

## One-time setup on Windows

```powershell
cd D:\repos\mission-access-lab
corepack enable
corepack prepare pnpm@11.15.1 --activate
pnpm config get registry
pnpm install
```

`pnpm config get registry` should print:

```text
https://registry.npmjs.org/
```

The Gradle wrapper bootstraps its pinned wrapper JAR on first use, so a separate Gradle installation is not required:

```powershell
cd apps\authorization-wrapper
.\gradlew.bat --version
cd ..\..
```

## Start infrastructure and publish the model

```powershell
pnpm infra:up
pnpm fga:bootstrap
$env:OPENFGA_STORE_ID = '<printed store id>'
$env:OPENFGA_MODEL_ID = '<printed model id>'
pnpm start
```

Nx runs the Angular dev server and invokes Gradle for Spring Boot. The operations dashboard has a mock fallback, so it renders before the API is available; the authorization playground requires the API.

## Useful commands

```powershell
pnpm start:web
pnpm start:api
pnpm test
pnpm lint
pnpm build
pnpm fga:test
pnpm install:check
```
