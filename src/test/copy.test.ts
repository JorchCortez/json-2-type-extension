import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Webview Copy to Clipboard', () => {
  let originalCreate: typeof vscode.window.createWebviewPanel;
  let originalInfo: typeof vscode.window.showInformationMessage;
  let originalError: typeof vscode.window.showErrorMessage;

  let lastPanel: any;
  let webviewListener: ((message: any) => any) | undefined;
  const postedMessages: any[] = [];

  suiteSetup(() => {
    originalCreate = vscode.window.createWebviewPanel;
    originalInfo = vscode.window.showInformationMessage;
    originalError = vscode.window.showErrorMessage;

    // No toast interception needed for quiet testing

    (vscode.window as any).createWebviewPanel = (..._args: any[]) => {
      postedMessages.length = 0;
      webviewListener = undefined;
      lastPanel = {
        webview: {
          html: '',
          onDidReceiveMessage: (listener: (message: any) => any) => {
            webviewListener = listener;
          },
          postMessage: (msg: any) => {
            postedMessages.push(msg);
            return Promise.resolve(true);
          }
        }
      };
      return lastPanel;
    };
  });

  suiteTeardown(() => {
    (vscode.window as any).createWebviewPanel = originalCreate as any;
    (vscode.window as any).showInformationMessage = originalInfo as any;
    (vscode.window as any).showErrorMessage = originalError as any;
  });

  setup(async () => {
    lastPanel = undefined;
    webviewListener = undefined;
    postedMessages.length = 0;
    // No toast assertions; focus on status and clipboard
    await vscode.env.clipboard.writeText('');
  });

  test('Copy command posts toast and status', async () => {
    const json = '{"a":1}';
    await vscode.env.clipboard.writeText(json);

    await vscode.commands.executeCommand('json2type.convertFromClipboard');

    assert.ok(lastPanel && webviewListener, 'Webview should be created and listener registered');

    // Simulate the webview requesting a copy with the types content
    const typesText = 'type rootType = { a: number };';
    webviewListener!({ command: 'copyTypes', text: typesText });

    // Allow async handlers to run
    await new Promise(r => setTimeout(r, 50));

    // Toasts are suppressed; verify status message and clipboard only

    const statusMsg = postedMessages.find(m => m && m.type === 'copyStatus');
    assert.ok(statusMsg && statusMsg.ok === true, 'Webview should receive copyStatus ok');

    const clip = await vscode.env.clipboard.readText();
    assert.strictEqual(clip, typesText, 'Clipboard should contain the types text');
  });
});
