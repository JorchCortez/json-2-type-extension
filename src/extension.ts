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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "json2type" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('json2type.initialize', () => {
		var panel = vscode.window.createWebviewPanel(
			'json2type', // Identifies the type of the webview. Used internally
			'JSON2Type', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
				enableScripts: true
			} // Webview options. More on these later.
		);
		panel.webview.html = getWebviewContent();
	});

	context.subscriptions.push(disposable);
	
	// Register the convertJsonToType command
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
				console.log(`You selected: ${types}`);
				// Implement your desired action with the selectedText here

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
			</head>
			<body>
				<h1>Welcome to JSON2Type</h1>
				<p>This is a webview for the JSON2Type extension.</p>
				<pre>${text ? text : ''}</pre>
			</body>
			</html>`;
}



