# CI/CD Configuration for JSON2Type Extension

## Automation Overview
This repository is configured for automatic publishing to the VS Code Marketplace when code is pushed to the main branch.

## Follow along the development 
- Learn how this project started [here](https://www.thecoderaccoons.com/blog-posts/i-accidentally-made-a-vs-code-extension)
- Learn more about this project [here](https://www.thecoderaccoons.com/projects/json2type-generator)

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
