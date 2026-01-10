# JSON2Type
**JSON2Type** is a VS Code extension that converts JSON objects into TypeScript type definitions. Simply select any JSON text in your editor and convert it to properly formatted TypeScript types with syntax highlighting.
## ✨ Features
-  **🔄 JSON to TypeScript Conversion**: Convert any JSON object to TypeScript type definitions
-  **📋 Copy to Clipboard**: One-click copying of generated types
-  **🔧 Smart Type Extraction**: Nested objects are extracted into separate type definitions
-  **⚡ Context Menu Integration**: Right-click any selected JSON to convert

## 🚀 Usage
### Method 1: Context Menu (Recommended)
1. Select any JSON text in your editor
2. Right-click to open the context menu
3. Click **"Convert JSON to Type"**
4. View the generated TypeScript types in a new panel
5. Click **"Copy to Clipboard"** to copy the types

![json2type-usg](https://github.com/user-attachments/assets/37df9882-c3dc-44b7-bdd7-23c3511b8d02)

### Method 2: Command Palette
1. Select JSON text in your editor
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Search for **"Convert JSON to Type"**
4. Press Enter to generate types

### Method 3: From Clipboard (Terminal/Debug Console)
1. Copy JSON output from the Terminal or Debug Console
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Search for **"Convert JSON from Clipboard"**
4. Press Enter to generate types from the clipboard content

Tip: If you run **"Convert JSON to Type"** with an empty selection, the extension will automatically try parsing the clipboard content. You can also right-click anywhere in the editor and choose **"Convert JSON to Type"** with no selection; it will use the clipboard.

Alternative entry points:
- Editor context menu: Right-click in the editor → **Convert JSON from Clipboard**
- Terminal toolbar: In the Terminal panel title bar → **Convert JSON from Clipboard**

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
You can also select JavaScript/TypeScript assignments; the extension sanitizes the right-hand side and parses the JSON structure:

```ts
const items = [
	{ "id": 1, "val": 100 },
	{ "id": 2, "val": 380 }
];
```
Selecting the whole assignment or just the array will generate an `itemType` and a `rootType = itemType[]`.

## ⚙️ Configuration

The extension works out of the box with sensible defaults:
-  **Root Type Name**: `rootType`
-  **Singularization**: Enabled (e.g., `posts` → `postType`)
-  **Object Extraction**: Enabled (nested objects become separate types)
-  **Indentation**: 2 spaces
-  **Quotes**: Single quotes

## 🎯 Requirements

- Visual Studio Code version 1.90.0 or higher
- No additional dependencies required

## 🐛 Known Issues
- Very large JSON objects may take a moment to process
- Complex nested structures might need manual type refinement

## 📝 Release Notes
  
### 1.0.5 - Initial Release

- ✅ Basic JSON to TypeScript conversion
- ✅ Context menu integration
- ✅ Syntax-highlighted output
- ✅ Copy to clipboard functionality
- ✅ Smart object type extraction
- ✅ Pre cleanup for trailing commas to prevent issues
- ✅ Improvement in error comments to better understand errors

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/JorchCortez/json-2-type-extension).

## 📄 License
This extension is licensed under the [MIT License](https://github.com/JorchCortez/json-2-type-extension/blob/main/LICENSE).

---
**Enjoy converting JSON to TypeScript! 🎉**

---
Developer docs: see `DEV-DOCS.md` for local install, testing, and F5 debugging.

## Commands
- **Convert JSON to Type**: Converts selected text or uses clipboard if no selection.
- **Convert JSON from Clipboard**: Converts JSON currently in the clipboard; available in Command Palette, editor context menu, and Terminal toolbar.
