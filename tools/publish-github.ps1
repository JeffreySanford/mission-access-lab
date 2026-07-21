param(
  [string]$Owner = 'JeffreySanford',
  [string]$Repository = 'mission-access-lab'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw 'GitHub CLI is required. Install it with: winget install --id GitHub.cli'
}

gh auth status
if ($LASTEXITCODE -ne 0) {
  throw 'Authenticate first with: gh auth login'
}

$fullName = "$Owner/$Repository"
$existing = gh repo view $fullName --json nameWithOwner 2>$null
if ($LASTEXITCODE -eq 0) {
  if (-not (git remote get-url origin 2>$null)) {
    git remote add origin "https://github.com/$fullName.git"
  }
  git push -u origin main
} else {
  gh repo create $fullName --public --source . --remote origin --push --description 'Nx polyglot training lab for Angular, Spring Boot, OpenFGA, PostgreSQL, observability, and authorization testing.'
}

Write-Host "Published: https://github.com/$fullName" -ForegroundColor Green
