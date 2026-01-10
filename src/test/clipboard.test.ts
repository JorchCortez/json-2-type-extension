import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Clipboard and Selection Fallback', () => {
  let originalCreate: typeof vscode.window.createWebviewPanel;
  let lastPanel: any;

  suiteSetup(() => {
    originalCreate = vscode.window.createWebviewPanel;
    (vscode.window as any).createWebviewPanel = (..._args: any[]) => {
      lastPanel = { webview: { html: '' } };
      return lastPanel;
    };
  });

  suiteTeardown(() => {
    (vscode.window as any).createWebviewPanel = originalCreate as any;
  });

  setup(async () => {
    lastPanel = undefined;
    await vscode.env.clipboard.writeText('');
  });

  test('Convert from clipboard command creates webview with types', async () => {
    const json = '[{"id":1,"val":100},{"id":2,"val":380}]';
    await vscode.env.clipboard.writeText(json);

    await vscode.commands.executeCommand('json2type.convertFromClipboard');

    assert.ok(lastPanel, 'WebviewPanel should be created');
    const html: string = lastPanel.webview.html;
    assert.ok(html && html.length > 0, 'Webview HTML should be set');
    assert.ok(html.includes('Generated TypeScript Types'), 'Webview content should include header');
    assert.ok(html.includes('type') && html.includes('val'), 'Generated types should be present');
  });

  test('Selection fallback uses clipboard when selection is empty', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: '' });
    await vscode.window.showTextDocument(doc);

    const json = '{"user":{"id":123,"name":"John"}}';
    await vscode.env.clipboard.writeText(json);

    await vscode.commands.executeCommand('json2type.convertJsonToType');

    assert.ok(lastPanel, 'WebviewPanel should be created via selection fallback');
    const html: string = lastPanel.webview.html;
    assert.ok(html.includes('type'), 'Generated types should be present');
    assert.ok(html.includes('user'), 'Should include user property');
  });
});
