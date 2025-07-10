# Azure-Hosted VSCode Coding Tracker Server Deployment

This document serves as the primary context for a Gemini agent working within the `vscode-coding-tracker-server` repository.

## 0. Context for the Agent

This repository now consolidates both the `vscode-coding-tracker-server` application code and its associated Azure infrastructure (Bicep) and CI/CD (GitHub Actions) definitions.

- **Goal:** Successfully deploy the `vscode-coding-tracker-server` to Azure App Service, making it accessible for VSCode clients.

- **Current Status:**
    - The `infra.bicep` file (defining Azure resources) and the `.github/workflows` directory (containing CI/CD pipelines) have been moved into this repository.
    - The `infra.bicep` is configured for the `F1` (Free) App Service Plan SKU and targets `NODE|22-lts` for the Linux runtime.
    - The `deploy-infra.yml` (for infrastructure deployment) and `deploy-server.yml` (for application code deployment) workflows are present.
    - The `vscode-coding-tracker-server` application code itself is currently built for an older Node.js version (8.x) and requires an upgrade to Node.js 20.x/22.x LTS for compatibility with Azure App Service.
    - The primary blocker is a persistent `LinuxFxVersion` error during the `deploy-infra.yml` workflow, preventing the successful provisioning of the Azure App Service.

## 1. Implementation Plan (Phased Approach)

### Phase 1: Resolve Bicep Infrastructure Deployment Issues

**Goal:** Successfully provision the Azure App Service using `infra.bicep`, overcoming the `LinuxFxVersion` error.

**Tasks:**
- Review `infra.bicep` for any remaining issues related to `linuxFxVersion` or other `siteConfig` properties.
- Utilize the debug logging enabled in `deploy-infra.yml` to gain more insights into the deployment failure.
- If the `LinuxFxVersion` error persists, consider deploying a *minimal* `infra.bicep` (containing only the App Service Plan and Web App with `NODE|22-lts`) to isolate the problem.
- Ensure the necessary GitHub secrets (`AZURE_CREDENTIALS`, `AZURE_RESOURCE_GROUP`, `AZURE_WEBAPP_NAME`, `UPLOAD_TOKEN`) are correctly configured in this repository.
- Trigger the `deploy-infra.yml` workflow and analyze its output.

### Phase 2: Upgrade Node.js Application Code

**Goal:** Update the `vscode-coding-tracker-server` application code to be fully compatible with Node.js 20.x/22.x LTS.

**Tasks:**
- Analyze `package.json` to identify outdated dependencies and any existing Node.js version specifications.
- Modify `package.json` to:
    - Remove any old `@types/node` entries.
    - Add or update the `engines` field to specify `"node": ">=20.0.0"` or `"node": ">=22.0.0"`.
    - Update all key dependencies (e.g., `express`, `body-parser`, `fs-extra`, `morgan`, `serve-favicon`, `colors`, `commander`, and their `@types` counterparts) to their latest stable versions compatible with Node.js 20.x/22.x.
- Run `npm install` locally to install the updated dependencies.
- Run `npm test` (if a test script is available) locally to verify that the server still functions correctly after the upgrade.
- Commit and push these code changes to the `main` (or `master`) branch of this repository.

### Phase 3: Deploy Upgraded Server Code

**Goal:** Deploy the Node.js 20.x/22.x compatible server code to the successfully provisioned Azure App Service.

**Tasks:**
- The `deploy-server.yml` workflow should automatically trigger upon pushing code changes to the `main` branch.
- Monitor the `deploy-server.yml` workflow for successful completion.
- Verify that the server is running on the Azure App Service.

### Phase 4: VSCode Extension Configuration & Verification

**Goal:** Configure VSCode environments to log coding activity and verify data flow to the deployed server.

**Tasks:**
- Install the `hangxingliu.vscode-coding-tracker` extension on each VSCode environment (Windows and WSL).
- Configure the VSCode `settings.json` with the deployed server's URL and your `uploadToken`.
- Perform coding activity and confirm that events are uploaded and appear on the server dashboard (`https://<YOUR_APP_NAME>.azurewebsites.net`).

### Phase 5: (Optional) Extend VSCode Extension for Terminal Tracking

**Goal:** Implement and deploy a forked VSCode extension capable of tracking terminal activity.

**Tasks:**
- Refer to the original `GEMINI.md` (Section 8) for detailed instructions on forking the client-side extension, adding terminal tracking logic, testing, and publishing your custom extension.