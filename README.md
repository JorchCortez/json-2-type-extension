# JSON2Type
**JSON2Type** is a VS Code extension that converts JSON objects into TypeScript type definitions. Select JSON in the editor or use the clipboard/terminal to quickly generate clean, syntax-highlighted types.
## ✨ Features
-  **🔄 JSON → TypeScript**: Convert JSON objects/arrays to TypeScript type definitions
-  **📋 Copy to Clipboard**: One click to copy generated types
-  **🔧 Smart Extraction**: Nested objects are extracted into separate types
-  **📝 Live Root Type Name**: Update the root type name in the panel and see types refresh instantly
-  **🖥️ Terminal Link Support**: Click JSON right in the integrated Terminal to convert it
-  **⚡ Editor Integration**: Right‑click selected JSON to convert; command palette entries included

## 🚀 Usage
### Method 1: Editor Selection (Recommended)
1. Select JSON text in your editor
2. Right‑click and choose **Convert JSON to Type** (or use the Command Palette)
3. A panel opens with syntax‑highlighted TypeScript types
4. Use the **Root type** input to rename the top‑level type live
5. Click **Copy to Clipboard** to copy the result

![json2type-usg](https://github.com/user-attachments/assets/37df9882-c3dc-44b7-bdd7-23c3511b8d02)

### Method 2: Command Palette
1. Select JSON text in your editor
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run **Convert JSON to Type**
4. View and copy from the panel

### Method 3: From Clipboard (Terminal/Debug Console)
1. Copy JSON from the Terminal or Debug Console
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run **Convert JSON from Clipboard**
4. The panel opens with generated types

Note: The selection command requires a selection. For clipboard content, use **Convert JSON from Clipboard**.

Alternative entry points:
- Editor context menu: Right‑click in the editor → **Convert JSON from Clipboard**
- Terminal view title: In the Terminal panel bar → **Convert JSON from Clipboard**

### Method 4: Terminal Line Link (Click‑to‑Convert)
When JSON appears in a Terminal line, a link is embedded from the first `{` or `[` to the end of the line. Click it to open the conversion panel directly.

## 📖 Example
**Input JSON:**
```json
{
	"user": {
		"id": 123,
		"name": "John Doe",
		"email": "john@example.com"
	},
	"posts": [
		{
			"title": "Hello World",
			"published": true,
			"tags": ["typescript", "vscode"]
		}
	]
}
```

**Generated TypeScript:**
```typescript
type  userType  = {
	id:  number;
	name:  string;
	email:  string;
};

type  postType  = {
	title:  string;
	published:  boolean;
	tags:  string[];
};

type  rootType  = {
	user:  userType;
	posts:  postType[];
};

```

### JS/TS Snippet Example
You can also select JavaScript/TypeScript assignments; the extension sanitizes the right‑hand side and parses the JSON structure:

```ts
const items = [
	{ "id": 1, "val": 100 },
	{ "id": 2, "val": 380 }
];
```
Selecting the whole assignment or just the array will generate an `itemType` and a `rootType = itemType[]`.

Additional sanitization supported:
- Console‑style prefixes: `Object { ... }`, `Array [ ... ]`
- Parenthesized RHS values
- Single‑member selections like `"questLog": {...}` are wrapped into `{ ... }`

### Sanitization & Supported Input
- Removes `//` and `/* ... */` comments only when outside strings (URLs like `http://...` are preserved)
- Removes trailing commas before `}` or `]`, and at end‑of‑input
- Handles assignments and right‑hand‑side extraction (e.g., `const x = {...};` → `{...}`)
- Tolerates CRLF line endings; cleans common console/TS syntax noise
- Falls back to JSON5 parsing for JS‑like objects (single quotes, unquoted keys)

## ⚙️ Configuration

Works out of the box with sensible defaults:
-  **Root Type Name**: `rootType` (editable in the panel)
-  **Singularization**: Enabled (e.g., `posts` → `postType`)
-  **Object Extraction**: Enabled (nested objects become separate types)
-  **Indentation**: 2 spaces
-  **Quotes**: Single quotes

## 🎯 Requirements

- Visual Studio Code version 1.90.0 or higher
- No additional dependencies required

## 🐛 Known Issues
- Very large JSON can take a moment
- Complex structures might need manual refinement

## 🛠️ Troubleshooting
- "Failed to generate types: Invalid JSON syntax": Ensure input is valid JSON or JSON‑like (comments are fine). Check for unmatched quotes or brackets.
- Clipboard conversion fails: Confirm the clipboard contains JSON; for selection, the command requires a non‑empty selection.
- URLs being treated as comments: Fixed — `http://` inside strings is preserved.

## 📝 Release Notes
  
### 1.1.3
- ✅ Improved sanitization: remove comments and trailing commas only outside strings
- ✅ Trailing comma tolerance at end‑of‑input
- ✅ Prevent accidental stripping of `//` in URLs like `http://...`

### 1.1.1
- ✅ Live root type name editing in the panel
- ✅ Terminal link provider (click JSON in Terminal to convert)
- ✅ Selection command uses selection only (clipboard has its own command)
- ✅ Improved sanitization for console‑style and single‑member selections
- ✅ JSON5 fallback for trailing commas, single quotes, and unquoted keys
- ✅ Syntax‑highlighted output and copy button

### 1.0.5 — Initial Release
- ✅ Basic JSON → TypeScript conversion
- ✅ Context menu integration
- ✅ Syntax‑highlighted output
- ✅ Copy to clipboard
- ✅ Smart object type extraction
- ✅ Pre‑cleanup for trailing commas
- ✅ Improved error messages

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/JorchCortez/json-2-type-extension).

## 📄 License
This extension is licensed under the [MIT License](https://github.com/JorchCortez/json-2-type-extension/blob/main/LICENSE).

---
**Enjoy converting JSON to TypeScript! 🎉**

---
Developer docs: see `DEV-DOCS.md` for local install, testing, and F5 debugging.

## Commands
- **Convert JSON to Type**: Converts selected text (requires a selection).
- **Convert JSON from Clipboard**: Converts JSON in the clipboard; available in Command Palette, editor context menu, and Terminal title bar.
