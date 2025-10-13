// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GenerateOptions } from './lib/types';
import { generateTypes } from './lib/generator';

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
}

export function convertJsonToType(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('json2type.convertJsonToType', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			if (!selectedText || selectedText.trim().length === 0) {
				vscode.window.showWarningMessage('Please select some JSON text to convert.');
				return;
			}

			try {
			const parsedJson = JSON.parse(selectedText);
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
					'json2type', // Identifies the type of the webview. Used internally
					'JSON2Type', // Title of the panel displayed to the user
					vscode.ViewColumn.One, // Editor column to show the new webview panel in.
					{
						enableScripts: true
					} // Webview options. More on these later.
				);
				panel.webview.html = getWebviewContent(types);
			} catch (err) {
				vscode.window.showErrorMessage('Failed to generate types: Invalid JSON input.');
			}

		} else {
			vscode.window.showInformationMessage('No active editor found.');
			console.log('No active editor found.');
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(text?: string): string {
	return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
				<div class="code-container">
					<pre id="generated-code">${text ? highlightTypeScript(text) : 'No code generated yet.'}</pre>
				</div>
				<button onclick="copyToClipboard()">Copy to Clipboard</button>
				
				<script>
					function copyToClipboard() {
						const codeElement = document.getElementById('generated-code');
						const textToCopy = codeElement.textContent || codeElement.innerText;
						
						navigator.clipboard.writeText(textToCopy).then(function() {
							// Show success feedback
							const button = event.target;
							const originalText = button.textContent;
							button.textContent = 'Copied!';
							button.classList.add('copy-success');
							
							setTimeout(() => {
								button.textContent = originalText;
								button.classList.remove('copy-success');
							}, 2000);
						}).catch(function(err) {
							console.error('Could not copy text: ', err);
						});
					}
				</script>
			</body>
			</html>`;
}

function highlightTypeScript(code: string): string {
	return code
		.replace(/\b(type|interface|export|import|from|as)\b/g, '<span class="keyword">$1</span>')
		.replace(/\b([A-Z][a-zA-Z0-9]*Type)\b/g, '<span class="type-name">$1</span>')
		.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '<span class="property">$1</span><span class="punctuation">:</span>')
		.replace(/\?/g, '<span class="optional">?</span>')
		.replace(/[{}[\];]/g, '<span class="punctuation">$&</span>');
}
