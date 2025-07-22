# VSCode Coding Tracker Extension Fork and Development

This document serves as the primary context for a Gemini agent working on a forked version of the `vscode-coding-tracker` extension.

## 0. Context for the Agent

This session focuses on modifying and extending the existing VSCode Coding Tracker extension. The primary goal is to implement new features (e.g., terminal activity tracking) and potentially publish a custom version of the extension.

- **Goal:** Successfully fork the `vscode-coding-tracker` extension, set up a development environment, implement new features, and prepare for publishing.

- **Current Status:**
    - The original `vscode-coding-tracker-server` is now successfully deployed and operational.
    - The need has arisen to extend the client-side VSCode extension to track additional activities, such as terminal usage.
    - The existing extension's codebase needs to be forked and set up for local development.

## 1. Implementation Plan (Phased Approach)

### Phase 1: Fork and Setup Development Environment

**Goal:** Create a fork of the `vscode-coding-tracker` extension and prepare it for local development.

**Tasks:**
- Fork the official `hangxingliu.vscode-coding-tracker` repository on GitHub.
- Clone the forked repository to the local machine.
- Install necessary Node.js dependencies (`npm install`).
- Understand the project structure and entry points (e.g., `extension.ts`, `package.json`).
- Verify the development setup by running the extension in VSCode's Extension Development Host.

### Phase 2: Implement New Features (e.g., Terminal Tracking)

**Goal:** Add new functionality to the forked extension, starting with terminal activity tracking.

**Tasks:**
- Identify relevant VSCode API events for terminal activity (e.g., `vscode.window.onDidOpenTerminal`, `vscode.window.onDidCloseTerminal`, `vscode.window.onDidChangeActiveTerminal`).
- Implement logic to capture terminal events (e.g., terminal creation, destruction, active status changes, and potentially command execution).
- Integrate the captured terminal data with the existing data reporting mechanism, ensuring it's sent to the `vscode-coding-tracker-server`.
- Design the data structure for terminal events to be compatible with the server's `upload` endpoint or propose server-side changes if necessary.

### Phase 3: Testing and Debugging

**Goal:** Thoroughly test the new features and ensure the extension functions correctly without regressions.

**Tasks:**
- Write unit and integration tests for the new terminal tracking logic.
- Manually test the extension in the Extension Development Host, verifying that terminal activities are correctly captured and sent to the server.
- Debug any issues encountered during testing.

### Phase 4: Prepare for Publishing

**Goal:** Prepare the modified extension for potential publishing to the VSCode Marketplace or for local installation.

**Tasks:**
- Update `package.json` with a new name, version, and publisher ID to avoid conflicts with the original extension.
- Review and update `README.md` to reflect new features and changes.
- Generate a VSIX package (`vsce package`).

### Phase 5: Publish (Optional)

**Goal:** Publish the custom extension to the VSCode Marketplace.

**Tasks:**
- Create a publisher account on the VSCode Marketplace (if not already done).
- Use `vsce publish` to upload the VSIX package.
- Monitor the publishing process and address any errors.

