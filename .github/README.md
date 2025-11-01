# CI/CD Configuration for JSON2Type Extension

## Automation Overview
This repository is configured for automatic publishing to the VS Code Marketplace when code is pushed to the main branch.

## Required GitHub Secrets
Make sure the following secrets are configured in your GitHub repository:

### VSCE_PAT (Required)
- **Description**: Visual Studio Code Extension Personal Access Token
- **How to get it**:
  1. Go to https://dev.azure.com/
  2. Sign in with your Microsoft account
  3. Go to User Settings > Personal Access Tokens
  4. Create new token with these permissions:
     - **Organization**: All accessible organizations
     - **Expiration**: 1 year (or as needed)
     - **Scopes**: Custom defined > Marketplace > Publish
  5. Copy the token and add it as a GitHub secret named `VSCE_PAT`

## Workflow Features
- ✅ Automatic version bumping (patch version)
- ✅ TypeScript compilation
- ✅ Extension packaging
- ✅ Marketplace publishing
- ✅ GitHub release creation
- ✅ VSIX file upload to releases

## Manual Triggering
You can also manually trigger the workflow from the GitHub Actions tab.

## Version Management
- Each push to main automatically increments the patch version
- Version changes are committed back to the repository
- Git tags are created for each release

## Branch Protection
Consider setting up branch protection rules for the main branch to require:
- Pull request reviews
- Status checks to pass
- Up-to-date branches before merging