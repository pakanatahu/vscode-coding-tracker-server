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

### Phase 1: Resolve Bicep Infrastructure Deployment Issues (Completed)

**Goal:** Successfully provision the Azure App Service using `infra.bicep`, overcoming the `LinuxFxVersion` error.

**Tasks:**
- Reviewed `infra.bicep` for any remaining issues related to `linuxFxVersion` or other `siteConfig` properties.
- Utilized the debug logging enabled in `deploy-infra.yml` to gain more insights into the deployment failure.
- Resolved the `LinuxFxVersion` error and successfully provisioned the Azure App Service.
- Moved `infra.bicep` to `.azure/infra.bicep` for better organization.

### Phase 2: Upgrade Node.js Application Code (Completed)

**Goal:** Update the `vscode-coding-tracker-server` application code to be fully compatible with Node.js 20.x/22.x LTS.

**Tasks:**
- Analyzed `package.json` to identify outdated dependencies and any existing Node.js version specifications.
- Modified `package.json` to:
    - Remove any old `@types/node` entries.
    - Added or updated the `engines` field to specify `"node": ">=22.0.0"`.
    - Updated all key dependencies (e.g., `express`, `body-parser`, `fs-extra`, `morgan`, `serve-favicon`, `colors`, `commander`, and their `@types` counterparts) to their latest stable versions compatible with Node.js 20.x/22.x.
- Ran `npm install` locally to install the updated dependencies.
- Ran `npm test` (if a test script is available) locally to verify that the server still functions correctly after the upgrade.
- Committed and pushed these code changes to the `main` (or `master`) branch of this repository.

### Phase 3: Deploy Upgraded Server Code (Completed)

**Goal:** Deploy the Node.js 20.x/22.x compatible server code to the successfully provisioned Azure App Service.

**Tasks:**
- The `deploy-server.yml` workflow should automatically trigger upon pushing code changes to the `main` branch.
- Monitored the `deploy-server.yml` workflow for successful completion.
- Verified that the server is running on the Azure App Service.

### Phase 4: Data Migration (In Progress)

**Goal:** Migrate existing tracked data from local machines to the Azure-hosted server.

**Tasks:**
- Placed `.db` files from old local `vscode-coding-tracker` servers into the `migration/` directory (which is git-ignored).
- Developed a Node.js script (`migration/scripts/migrate_data.js`) to parse `.db` files and inject data into the Azure-hosted server's database via the `/ajax/upload` endpoint.
- Executing the migration script to upload records.

### Phase 5: VSCode Extension Configuration & Verification

**Goal:** Configure VSCode environments to log coding activity and verify data flow to the deployed server.

**Tasks:**
- Install the `hangxingliu.vscode-coding-tracker` extension on each VSCode environment (Windows and WSL).
- Configure the VSCode `settings.json` with the deployed server's URL and your `uploadToken`.
- Perform coding activity and confirm that events are uploaded and appear on the server dashboard (`https://<YOUR_APP_NAME>.azurewebsites.net`).

### Phase 6: (Optional) Extend VSCode Extension for Terminal Tracking

**Goal:** Implement and deploy a forked VSCode extension capable of tracking terminal activity.

**Tasks:**
- Refer to the original `GEMINI.md` (Section 8) for detailed instructions on forking the client-side extension, adding terminal tracking logic, testing, and publishing your custom extension.

# Terminal Activity Data Format

This document describes the data format for terminal activity records uploaded by the VSCode Coding Tracker extension to the server. These records are used to track time spent in the integrated terminal.

## Data Fields

The following fields are included in each terminal activity data upload:

*   **`version`** (string): The version of the data format. Currently `4.0`.
    *   Example: `"4.0"`

*   **`token`** (string): The upload token configured in the VSCode extension settings.
    *   Example: `"55988b492c4cd09d82bd27a4aed36d05"`

*   **`type`** (string): The type of activity. For terminal records, this is always `terminal`.
    *   Example: `"terminal"`

*   **`time`** (number): The Unix timestamp (in milliseconds) when the terminal activity started.
    *   Example: `1752163454641`

*   **`long`** (number): The duration of the terminal activity in milliseconds.
    *   Example: `59407`

*   **`lang`** (string): The language or type of the activity. For terminal records, this is always `terminal`.
    *   Example: `"terminal"`

*   **`file`** (string): The name of the terminal.
    *   Example: `"cmd"`, `"bash"`, `"zsh"`

*   **`proj`** (string): The absolute path to the root of the VSCode workspace/project where the terminal activity occurred. If no workspace is open, this will be `unknown`.
    *   Example: `"C:/github/vscode-coding-tracker"`, `"unknown"`

*   **`pcid`** (string): A unique identifier for the computer where the activity took place.
    *   Example: `"unknown-win32"`

*   **`vcs_type`** (string): The type of Version Control System detected for the project. If no VCS is detected, this will be `none`.
    *   Example: `"git"`, `"none"`

*   **`vcs_repo`** (string): The URL of the VCS repository. If no VCS is detected, this will be `none`.
    *   Example: `"https://github.com/hangxingliu/vscode-coding-tracker"`, `"none"`

*   **`vcs_branch`** (string): The active branch of the VCS repository. If no VCS is detected, this will be `none`.
    *   Example: `"main"`, `"none"`

*   **`line`** (number): Not applicable for terminal activity. Always `0`.
    *   Example: `0`

*   **`char`** (number): Not applicable for terminal activity. Always `0`.
    *   Example: `0`

*   **`r1`** (string): Reserved field. Currently `1`.
    *   Example: `"1"`

*   **`r2`** (string): Reserved field. Currently empty.
    *   Example: `""`
