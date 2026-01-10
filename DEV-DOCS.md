# Developer Docs: JSON2Type

This document covers local setup, running tests, and debugging the extension.

## Install
- Prerequisites: Node.js (LTS), VS Code 1.90+ (per engines).
- Install dependencies:

```powershell
npm install
```

## Run Tests
Runs the VS Code extension tests via the test CLI.

```powershell
npm test
```

Optional watchers (keep build and test TS output up-to-date):

```powershell
npm run watch
npm run watch-tests
```

## Debug (F5)
Start the Extension Development Host to debug the command logic.

- In VS Code: Run and Debug → "Run Extension" or press **F5**.
- A new sandbox window opens (Extension Development Host).
- In that window:
  - Select valid JSON, or a JS/TS snippet like `const items = [{ "id": 1, "val": 100 }]`.
  - Right-click → "Convert JSON to Type" or use the Command Palette.
  - The generated types appear in a webview; use the copy button as needed.

## Commands & Menus
- Command Palette:
  - Convert JSON to Type
  - Convert JSON from Clipboard
- Editor Context Menu:
  - Convert JSON to Type (uses clipboard when no selection)
  - Convert JSON from Clipboard
- Terminal View Title (toolbar):
  - Convert JSON from Clipboard

Reference files:
- Extension entry: [src/extension.ts](src/extension.ts)
- Type generator: [src/lib/generator.ts](src/lib/generator.ts)
- Selection sanitizer: [src/lib/sanitize.ts](src/lib/sanitize.ts)
- Tests: [src/test](src/test)
