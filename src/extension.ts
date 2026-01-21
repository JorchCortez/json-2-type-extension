import json5 from 'json5';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GenerateOptions } from './lib/types';
import { generateTypes } from './lib/generator';
import { sanitizeSelection, cleanJsonString } from './lib/sanitize';

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
	textContext = context;
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

let textContext: vscode.ExtensionContext | undefined;

function processInputText(raw: string) {
	try {
		const jsonCandidate = sanitizeSelection(raw);
		const cleanedJson = cleanJsonString(jsonCandidate);

		let parsedJson: unknown;
		try {
			parsedJson = JSON.parse(cleanedJson);
		} catch (parseErr) {
			// Fallback to JSON5 for JS-like objects from consoles (single quotes, unquoted keys, trailing commas)
			parsedJson = json5.parse(cleanedJson);
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
		const scriptUri = (textContext && typeof (panel.webview as any).asWebviewUri === 'function')
			? panel.webview.asWebviewUri(vscode.Uri.joinPath(textContext.extensionUri, 'media', 'panel.js'))
			: undefined;
		panel.webview.html = getWebviewContent(types, generateOptions.rootName, panel.webview, nonce, scriptUri);

		panel.webview.onDidReceiveMessage((message) => {
			console.log('[json2type] message from webview:', message);
			if (!message) {return;}
			if (message.command === 'webviewReady') {
				// Webview script loaded; no toast in quiet mode
				return;
			}
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
			if (message.command === 'copyTypes') {
				const textToCopy: string = String(message.text ?? '');
				if (!textToCopy) {
					panel.webview.postMessage({ type: 'copyStatus', ok: false, reason: 'empty' });
					return;
				}
				vscode.env.clipboard.writeText(textToCopy).then(() => {
					panel.webview.postMessage({ type: 'copyStatus', ok: true });
				}, (err: unknown) => {
					const reason = typeof err === 'object' && err && 'message' in (err as any) ? String((err as any).message) : 'copy failed';
					vscode.window.showErrorMessage('Copy failed: ' + reason);
					panel.webview.postMessage({ type: 'copyStatus', ok: false, reason });
				});
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

function getWebviewContent(text: string | undefined, rootName: string | undefined, webview: vscode.Webview, nonce: string, scriptUri?: vscode.Uri): string {
	const initialRawEncoded = encodeURIComponent(String(text ?? ''));
	return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';">
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
					<pre id="generated-code" data-raw="${initialRawEncoded}">${text ? highlightTypeScript(text) : 'No code generated yet.'}</pre>
				</div>
				<button id="copyBtn">Copy to Clipboard</button>
				${scriptUri ? `<script src="${scriptUri}"></script>` : ''}
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
