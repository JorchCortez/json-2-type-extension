# JSON2Type
**JSON2Type** is a VS Code extension that converts JSON objects into TypeScript type definitions. Simply select any JSON text in your editor and convert it to properly formatted TypeScript types with syntax highlighting.
## ✨ Features
-  **🔄 JSON to TypeScript Conversion**: Convert any JSON object to TypeScript type definitions
-  **🎨 Syntax Highlighting**: Generated types are displayed with proper TypeScript syntax highlighting
-  **📋 Copy to Clipboard**: One-click copying of generated types
-  **🌓 Theme Support**: Automatic light/dark theme detection
-  **🔧 Smart Type Extraction**: Nested objects are extracted into separate type definitions
-  **⚡ Context Menu Integration**: Right-click any selected JSON to convert

## 🚀 Usage
### Method 1: Context Menu (Recommended)
1. Select any JSON text in your editor
2. Right-click to open the context menu
3. Click **"Convert JSON to Type"**
4. View the generated TypeScript types in a new panel
5. Click **"Copy to Clipboard"** to copy the types

![https://github.com/TheCodeRaccoons/Imagery/blob/main/json2type-usage.gif]()

### Method 2: Command Palette
1. Select JSON text in your editor
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Search for **"Convert JSON to Type"**
4. Press Enter to generate types

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

## ⚙️ Configuration

The extension works out of the box with sensible defaults:
-  **Root Type Name**: `rootType`
-  **Singularization**: Enabled (e.g., `posts` → `postType`)
-  **Object Extraction**: Enabled (nested objects become separate types)
-  **Indentation**: 2 spaces
-  **Quotes**: Single quotes

## 🎯 Requirements

- Visual Studio Code version 1.105.0 or higher
- No additional dependencies required

## 🐛 Known Issues
- Very large JSON objects may take a moment to process
- Complex nested structures might need manual type refinement

## 📝 Release Notes
  
### 0.0.1 - Initial Release

- ✅ Basic JSON to TypeScript conversion
- ✅ Context menu integration
- ✅ Syntax-highlighted output
- ✅ Copy to clipboard functionality
- ✅ Light/dark theme support
- ✅ Smart object type extraction

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/JorchCortez/json-2-type-extension).

## 📄 License
This extension is licensed under the [MIT License](LICENSE).

---
**Enjoy converting JSON to TypeScript! 🎉**