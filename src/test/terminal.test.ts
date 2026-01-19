import * as assert from 'assert';
import * as vscode from 'vscode';
import { JsonTerminalLinkProvider } from '../extension';

suite('Terminal Link JSON Conversion', () => {
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

  setup(() => {
    lastPanel = undefined;
  });

  test('Detects JSON in terminal line and converts', async () => {
    const provider = new JsonTerminalLinkProvider();
    const jsonLine = 'INFO: response => {"code":200,"data":{"id":42,"name":"Neo"}}';

    const ctx: vscode.TerminalLinkContext = {
      line: jsonLine,
      terminal: {} as vscode.Terminal,
    };

    const links = provider.provideTerminalLinks(ctx, new vscode.CancellationTokenSource().token);
    assert.ok(links && links.length > 0, 'Should provide a terminal link for JSON');

    await provider.handleTerminalLink(links![0]);

    assert.ok(lastPanel, 'WebviewPanel should be created from terminal link');
    const html: string = lastPanel.webview.html;
    assert.ok(html.includes('Generated TypeScript Types'), 'Webview content should include header');
    assert.ok(html.includes('<span class="property">data</span>'), 'Should include JSON properties in highlighted output');
    assert.ok(html.includes('<span class="property">name</span>'), 'Should include nested properties');
  });
});
