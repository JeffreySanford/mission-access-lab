# Local development

## One-time setup on Windows

```powershell
cd D:\repos\mission-access-lab
npm install
cd apps\authorization-wrapper
gradle wrapper --gradle-version 8.14.3
cd ..\..
```

## Start infrastructure and publish the model

```powershell
npm run infra:up
npm run fga:bootstrap
$env:OPENFGA_STORE_ID = '<printed store id>'
$env:OPENFGA_MODEL_ID = '<printed model id>'
npm run start
```

Nx runs the Angular dev server and invokes Gradle for Spring Boot. The dashboard has a mock fallback, so the visual view renders even before the API is available; the authorization playground requires the API.
