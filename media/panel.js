(function () {
    const vscode = acquireVsCodeApi();
    const codeEl = document.getElementById('generated-code');
    const previewEl = document.getElementById('rootNamePreview');
    const inputEl = document.getElementById('rootNameInput');
    const copyBtn = document.getElementById('copyBtn');

    function decodeInitialRaw() {
        try {
            return decodeURIComponent(codeEl.getAttribute('data-raw') || '');
        } catch (e) {
            return '';
        }
    }

    function highlightTS(code) {
        return String(code)
            .replace(/\b(type|interface|export|import|from|as)\b/g, '<span class="keyword">$1<\/span>')
            .replace(/\b([A-Z][a-zA-Z0-9]*Type)\b/g, '<span class="type-name">$1<\/span>')
            .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '<span class="property">$1<\/span><span class="punctuation">:<\/span>')
            .replace(/\?/g, '<span class="optional">?<\/span>')
            .replace(/[{}[\];]/g, '<span class="punctuation">$&<\/span>');
    }

    function debounce(fn, delay) {
        let t;
        return function () {
            clearTimeout(t);
            const args = arguments;
            t = setTimeout(() => fn.apply(null, args), delay);
        };
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

    let lastTypesText = decodeInitialRaw();
    console.log('[json2type] webview external script loaded');
    vscode.postMessage({ command: 'webviewReady' });
    if (previewEl) {
        previewEl.textContent = (previewEl.textContent || '') + ' (script active)';
    }

    const onRootInput = debounce(() => {
        const val = (inputEl.value || '').trim();
        if (!val) {return;}
        vscode.postMessage({ command: 'updateRootName', rootName: val });
    }, 250);

    if (inputEl) {
        inputEl.addEventListener('input', () => {
            const val = inputEl.value || '';
            if (previewEl) {previewEl.textContent = '→ Will generate: ' + previewTypeName(val);}
            onRootInput();
        });
        inputEl.addEventListener('change', onRootInput);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {onRootInput();}
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'copyTypes', text: lastTypesText });
        });
    }

    window.addEventListener('message', (event) => {
        const msg = event.data || {};
        if (msg.type === 'updateTypes') {
            codeEl.innerHTML = highlightTS(msg.text || '');
            lastTypesText = msg.text || '';
            if (typeof msg.rootName === 'string') {inputEl.value = msg.rootName;}
            if (previewEl && typeof msg.rootName === 'string') {previewEl.textContent = '→ Will generate: ' + previewTypeName(msg.rootName);}
        }
    });

    window.addEventListener('message', (event) => {
        const msg = event.data || {};
        if (msg.type === 'copyStatus') {
            if (!copyBtn) {return;}
            if (msg.ok) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.classList.add('copy-success');
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copy-success');
                }, 2000);
            } else {
                console.error('Copy failed:', msg.reason);
            }
        }
    });
})();
