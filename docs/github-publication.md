# GitHub publication

The repository is initialized on `main` with an initial commit. To create and publish the public GitHub repository from Windows:

```powershell
cd D:\repos\mission-access-lab
.\tools\publish-github.ps1
```

The script verifies GitHub CLI authentication, creates `JeffreySanford/mission-access-lab` as a public repository when it does not exist, configures `origin`, and pushes `main`. It is idempotent: if the repository already exists, it pushes the current branch instead of trying to recreate it.

Install/authenticate the GitHub CLI only when needed:

```powershell
winget install --id GitHub.cli
gh auth login
```
