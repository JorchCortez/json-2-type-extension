// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GenerateOptions } from './lib/types';
import { generateTypes } from './lib/generator';
import { sanitizeSelection, cleanJsonString } from './lib/sanitize';
import { parse as json5Parse } from 'json5';

export interface AppOptions {
	rootName: string;
	singularize: boolean;
	literalThreshold: number;
	nullAsOptional: boolean;
	indent: number;
	quote: 'single' | 'double';
	extractObjects: boolean;
}

const defaultOptions: AppOptions = {
	rootName: 'rootType',
	singularize: true,
	literalThreshold: 0,
	nullAsOptional: false,
	indent: 2,
	quote: 'single',
	extractObjects: true
};

export function activate(context: vscode.ExtensionContext) {
	convertJsonToType(context);
	convertFromClipboard(context);

	// Provide inline terminal link to convert JSON directly from terminal lines
	const terminalLinkDisposable = vscode.window.registerTerminalLinkProvider(new JsonTerminalLinkProvider());
	context.subscriptions.push(terminalLinkDisposable);
}

// moved to lib/sanitize.ts

export function convertJsonToType(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('json2type.convertJsonToType', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			if (!selectedText || selectedText.trim().length === 0) {
				vscode.window.showWarningMessage('No selection found. Select JSON in the editor or use "Convert JSON from Clipboard".');
				return;
			}

			try {
				processInputText(selectedText);
			} catch (err) {
				let errorMessage = 'Failed to generate types: ';
				
				if (err instanceof SyntaxError) {
					errorMessage += `Invalid JSON syntax - Message: ${err.message}. ${err.cause ? ` ,Reason: ${err.cause}` : ''}`;
				} else if (err instanceof Error) {
					errorMessage += err.message;
				} else {
					errorMessage += 'Unknown error occurred while processing JSON';
				}

				vscode.window.showErrorMessage(errorMessage + ' | Selected JSON: ' + selectedText);
			}

		} else {
			vscode.window.showInformationMessage('No active editor found.');
			console.log('No active editor found.');
		}
	});

	context.subscriptions.push(disposable);
}

export function convertFromClipboard(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('json2type.convertFromClipboard', async () => {
		try {
			const clipboardText = await vscode.env.clipboard.readText();
			if (!clipboardText || clipboardText.trim().length === 0) {
				vscode.window.showWarningMessage('Clipboard is empty. Copy JSON from Terminal/Debug Console and try again.');
				return;
			}
			processInputText(clipboardText);
		} catch (err) {
			let errorMessage = 'Failed to read from clipboard: ';
			if (err instanceof Error) {
				errorMessage += err.message;
			}
			vscode.window.showErrorMessage(errorMessage);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function processInputText(raw: string) {
	try {
		const jsonCandidate = sanitizeSelection(raw);
		const cleanedJson = cleanJsonString(jsonCandidate);

		let parsedJson: unknown;
		try {
			parsedJson = JSON.parse(cleanedJson);
		} catch (parseErr) {
			// Fallback to JSON5 for JS-like objects from consoles (single quotes, unquoted keys, trailing commas)
			parsedJson = json5Parse(cleanedJson);
		}
		const generateOptions: GenerateOptions = {
			rootName: defaultOptions.rootName,
			singularize: defaultOptions.singularize,
			literalThreshold: defaultOptions.literalThreshold,
			nullAsOptional: defaultOptions.nullAsOptional,
			indent: defaultOptions.indent,
			quote: defaultOptions.quote,
			extractObjects: defaultOptions.extractObjects
		};

		const types = generateTypes(parsedJson, generateOptions);

		var panel = vscode.window.createWebviewPanel(
			'json2type',
			'JSON2Type',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);
		const nonce = getNonce();
		panel.webview.html = getWebviewContent(types, generateOptions.rootName, panel.webview, nonce);

		panel.webview.onDidReceiveMessage((message) => {
			if (!message) {return;}
			if (message.command === 'updateRootName') {
				const newRoot: string = String(message.rootName ?? '').trim();
				if (!newRoot) {
					vscode.window.showWarningMessage('Root type name cannot be empty.');
					return;
				}
				try {
					const updated = generateTypes(parsedJson, { ...generateOptions, rootName: newRoot });
					panel.webview.postMessage({ type: 'updateTypes', text: updated, rootName: newRoot });
				} catch (err) {
					let errorMessage = 'Failed to update root type: ';
					if (err instanceof Error) {errorMessage += err.message;}
					vscode.window.showErrorMessage(errorMessage);
				}
			}
		});
	} catch (err) {
		let errorMessage = 'Failed to generate types: ';
		if (err instanceof SyntaxError) {
			errorMessage += `Invalid JSON syntax - Message: ${err.message}. ${err.cause ? ` ,Reason: ${err.cause}` : ''}`;
		} else if (err instanceof Error) {
			errorMessage += err.message;
		} else {
			errorMessage += 'Unknown error occurred while processing input';
		}
		vscode.window.showErrorMessage(errorMessage);
	}
}

interface JsonTerminalLink extends vscode.TerminalLink { text: string }

export class JsonTerminalLinkProvider implements vscode.TerminalLinkProvider<JsonTerminalLink> {
	provideTerminalLinks(context: vscode.TerminalLinkContext, _token: vscode.CancellationToken): JsonTerminalLink[] | undefined {
		const line = context.line;

		// Heuristic: look for start of JSON object/array in the line
		const braceIdx = line.indexOf('{');
		const bracketIdx = line.indexOf('[');
		const startIdx = (braceIdx === -1) ? bracketIdx : (bracketIdx === -1 ? braceIdx : Math.min(braceIdx, bracketIdx));

		if (startIdx === -1) {
			return undefined;
		}

		// Link from the JSON start to end of line; sanitize will trim non-JSON suffixes
		const jsonPart = line.slice(startIdx);
		const link: JsonTerminalLink = { startIndex: startIdx, length: jsonPart.length, tooltip: 'Convert JSON to Type', text: jsonPart };
		return [link];
	}

	handleTerminalLink(link: JsonTerminalLink): vscode.ProviderResult<void> {
		const text = link.text ?? '';
		if (!text.trim()) {
			vscode.window.showWarningMessage('No JSON detected in terminal line.');
			return;
		}
		try {
			processInputText(text);
		} catch (err) {
			let errorMessage = 'Failed to process terminal JSON: ';
			if (err instanceof Error) {
				errorMessage += err.message;
			}
			vscode.window.showErrorMessage(errorMessage);
		}
	}
}

function getWebviewContent(text: string | undefined, rootName: string | undefined, webview: vscode.Webview, nonce: string): string {
	return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}';">
				<title>JSON2Type</title>
				<style>
					body {
						font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
						line-height: 1.6;
						margin: 20px;
						background-color: #1e1e1e;
						color: #d4d4d4;
					}
					
					@media (prefers-color-scheme: light) {
						body {
							background-color: #ffffff;
							color: #333333;
						}
						
						.code-container {
							background-color: #f8f8f8;
							border: 1px solid #e1e4e8;
						}
						
						.keyword {
							color: #0000ff;
						}
						
						.type-name {
							color: #267f99;
						}
						
						.property {
							color: #001080;
						}
						
						.punctuation {
							color: #333333;
						}
						
						.optional {
							color: #666666;
						}
						
						button {
							background-color: #0078d4;
							color: #ffffff;
						}
						
						button:hover {
							background-color: #106ebe;
						}
						
						h1 {
							color: #333333;
							border-bottom: 2px solid #e1e4e8;
						}
					}
					
					h1 {
						color: #d4d4d4;
						border-bottom: 2px solid #3c3c3c;
						padding-bottom: 10px;
					}
					
					.code-container {
						background-color: #0d1117;
						border: 1px solid #30363d;
						border-radius: 4px;
						margin: 20px 0;
						overflow: auto;
					}
					
					pre {
						margin: 0;
						padding: 16px;
						font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
						font-size: 14px;
						line-height: 1.4;
						overflow-x: auto;
						white-space: pre;
					}
					
					/* TypeScript syntax highlighting - Dark theme */
					.keyword {
						color: #569cd6;
						font-weight: bold;
					}
					
					.type-name {
						color: #4ec9b0;
						font-weight: bold;
					}
					
					.property {
						color: #9cdcfe;
					}
					
					.punctuation {
						color: #d4d4d4;
					}
					
					.optional {
						color: #808080;
					}
					
					button {
						background-color: #0e639c;
						color: #ffffff;
						border: none;
						padding: 8px 16px;
						border-radius: 4px;
						cursor: pointer;
						font-size: 13px;
						margin: 10px 5px 0 0;
						transition: background-color 0.2s ease;
					}
					
					button:hover {
						background-color: #1177bb;
					}
					
					button:active {
						background-color: #0a4d7a;
					}
					
					.copy-success {
						background-color: #28a745 !important;
					}
				</style>
			</head>
			<body>
				<h1>Generated TypeScript Types</h1>
				<p>Here are your generated TypeScript type definitions:</p>
				<div style="margin: 8px 0 16px 0; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
					<label for="rootNameInput">Root type:</label>
					<input id="rootNameInput" type="text" placeholder="rootType" value="${rootName ?? ''}" style="flex:0 0 220px; padding:6px 8px; border-radius:4px; border:1px solid #30363d; background:#0d1117; color:#d4d4d4;"/>
					<span id="rootNamePreview" style="opacity:.8; font-size:12px;">→ Will generate…</span>
				</div>
				<div class="code-container">
					<pre id="generated-code">${text ? highlightTypeScript(text) : 'No code generated yet.'}</pre>
				</div>
				<button id="copyBtn">Copy to Clipboard</button>
				
				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();

					function highlightTS(code) {
						return code
							.replace(/\b(type|interface|export|import|from|as)\b/g, '<span class="keyword">$1<\/span>')
							.replace(/\b([A-Z][a-zA-Z0-9]*Type)\b/g, '<span class="type-name">$1<\/span>')
							.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '<span class="property">$1<\/span><span class="punctuation">:<\/span>')
							.replace(/\?/g, '<span class="optional">?<\/span>')
							.replace(/[{}[\];]/g, '<span class="punctuation">$&<\/span>');
					}


					function debounce(fn, delay) {
						let t;
						return function() {
							clearTimeout(t);
							const args = arguments;
							t = setTimeout(() => fn.apply(null, args), delay);
						}
					}

					function toCamelCase(str) {
						return String(str)
							.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
							.replace(/^[A-Z]/, c => c.toLowerCase());
					}

					function previewTypeName(name) {
						const base = toCamelCase(name || 'root') || 'root';
						return base.endsWith('Type') ? base : base + 'Type';
					}

					const previewEl = document.getElementById('rootNamePreview');
					const inputEl = document.getElementById('rootNameInput');

					const onRootInput = debounce(() => {
						const val = (document.getElementById('rootNameInput').value || '').trim();
						if (!val) return; // ignore empty while typing
						vscode.postMessage({ command: 'updateRootName', rootName: val });
					}, 250);

					inputEl.addEventListener('input', () => {
						const val = inputEl.value || '';
						if (previewEl) previewEl.textContent = '→ Will generate: ' + previewTypeName(val);
						onRootInput();
					});
					inputEl.addEventListener('change', onRootInput);
					inputEl.addEventListener('keydown', (e) => {
						if (e.key === 'Enter') onRootInput();
					});

					window.addEventListener('message', (event) => {
						const msg = event.data || {};
						if (msg.type === 'updateTypes') {
							const codeElement = document.getElementById('generated-code');
							codeElement.innerHTML = highlightTS(msg.text || '');
							const input = document.getElementById('rootNameInput');
							if (typeof msg.rootName === 'string') input.value = msg.rootName;
							if (previewEl && typeof msg.rootName === 'string') previewEl.textContent = '→ Will generate: ' + previewTypeName(msg.rootName);
						}
					});
					function copyToClipboard(btn) {
						const codeElement = document.getElementById('generated-code');
						const textToCopy = codeElement.innerText || codeElement.textContent || '';
						navigator.clipboard.writeText(textToCopy).then(function() {
							const originalText = btn.textContent;
							btn.textContent = 'Copied!';
							btn.classList.add('copy-success');
							setTimeout(() => {
								btn.textContent = originalText;
								btn.classList.remove('copy-success');
							}, 2000);
						}).catch(function(err) {
							console.error('Could not copy text: ', err);
						});
					}

					document.getElementById('copyBtn').addEventListener('click', (e) => copyToClipboard(e.currentTarget));
				</script>
			</body>
			</html>`;
}

function getNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function highlightTypeScript(code: string): string {
	return code
		.replace(/\b(type|interface|export|import|from|as)\b/g, '<span class="keyword">$1</span>')
		.replace(/\b([A-Z][a-zA-Z0-9]*Type)\b/g, '<span class="type-name">$1</span>')
		.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '<span class="property">$1</span><span class="punctuation">:</span>')
		.replace(/\?/g, '<span class="optional">?</span>')
		.replace(/[{}[\];]/g, '<span class="punctuation">$&</span>');
}
