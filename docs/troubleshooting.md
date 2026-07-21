# Troubleshooting

## pnpm tries to reach an old corporate Nexus registry

Symptom:

```text
GET https://nexusrepository.fanniemae.com/... ENOTFOUND
```

The repository now contains a project-level `.npmrc` that overrides the registry for this project. From the repository root, verify it:

```powershell
pnpm config get registry
pnpm config get @angular:registry
pnpm config get @nx:registry
```

Each command should return `https://registry.npmjs.org/`.

If it does not, check for an environment variable that has higher precedence:

```powershell
Get-ChildItem Env:NPM_CONFIG_REGISTRY
Remove-Item Env:NPM_CONFIG_REGISTRY -ErrorAction SilentlyContinue
```

You can inspect the old user-level file without deleting it:

```powershell
npm config get userconfig
Get-Content (npm config get userconfig)
```

Then retry from the repository root:

```powershell
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
pnpm store prune
pnpm install
```

## `nx` is not recognized

This means `node_modules` does not exist or installation failed. Nx is a local development dependency; do not install it globally. Fix the registry problem and run `pnpm install` first.

## Gradle wrapper JAR is missing

Run the wrapper normally:

```powershell
cd apps\authorization-wrapper
.\gradlew.bat --version
```

The wrapper script downloads the pinned Gradle 8.14.3 wrapper JAR from the official Gradle GitHub repository on first use. Java 21 and internet access are required for that first run.

## Docker services do not start

```powershell
docker version
docker compose -f infra\compose.yaml config
docker compose -f infra\compose.yaml up
```

Ports used locally are 3000, 4200, 5432, 8080, 8081, 8082, and 8083. Stop any conflicting service before retrying.

## OpenFGA checks stay in demo mode

Run:

```powershell
pnpm infra:up
pnpm fga:bootstrap
```

Set the printed values in the same terminal before starting the API:

```powershell
$env:OPENFGA_STORE_ID = '<store id>'
$env:OPENFGA_MODEL_ID = '<model id>'
pnpm start:api
```
