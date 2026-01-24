// Attempts to extract a JSON-compatible substring from a JS/TS selection
export function sanitizeSelection(selection: string): string {
  const text = selection.trim();
  // If it already looks like JSON, return as-is
  if (text.startsWith('{') || text.startsWith('[')) {
    return text;
  }

  // Handle browser/console printed prefixes like "Object { ... }" or "Array [ ... ]"
  if (text.startsWith('Object {')) {
    return text.replace(/^Object\s+/, '');
  }
  if (text.startsWith('Array [')) {
    return text.replace(/^Array\s+/, '');
  }

  // Strip leading export keyword
  let candidate = text.replace(/^export\s+/, '');

  // If there's an assignment, take the right-hand side
  const eqIndex = candidate.indexOf('=');
  if (eqIndex !== -1) {
    candidate = candidate.slice(eqIndex + 1);
  }

  // Remove trailing semicolon and common TS assertions like `as const`
  candidate = candidate
    .replace(/\s+as\s+const\s*;?$/i, '')
    .replace(/;\s*$/m, '')
    .trim();

  // If it is wrapped in parentheses, unwrap
  if (candidate.startsWith('(') && candidate.endsWith(')')) {
    candidate = candidate.slice(1, -1).trim();
  }

  // If selection looks like a single object member (e.g., "key": {...})
  // or JS-like member (key: {...}), wrap it into an object so it becomes valid JSON
  const memberRegex = /^(?:["'][^"']+["']|[A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*[\s\S]+$/;
  if (memberRegex.test(candidate)) {
    candidate = `{ ${candidate} }`;
  }

  return candidate;
}

export function cleanJsonString(jsonString: string): string {
  // Robustly remove comments and trailing commas without touching content inside strings
  const src = jsonString;
  let out = '';
  let i = 0;
  const n = src.length;

  let inString = false;
  let stringQuote: '"' | '\'' | '' = '';
  let escaped = false;

  while (i < n) {
    const ch = src[i];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === stringQuote) {
        inString = false;
        stringQuote = '';
      }
      i++;
      continue;
    }

    // Not inside a string
    if (ch === '"' || ch === '\'') {
      inString = true;
      stringQuote = ch as '"' | '\'';
      out += ch;
      i++;
      continue;
    }

    // Handle line comments //...
    if (ch === '/' && i + 1 < n && src[i + 1] === '/') {
      // Skip until end of line (\n or \r)
      i += 2;
      while (i < n) {
        const c = src[i];
        if (c === '\n' || c === '\r') { break; }
        i++;
      }
      // Do not include the EOL itself; let normal flow add it
      continue;
    }

    // Handle block comments /* ... */
    if (ch === '/' && i + 1 < n && src[i + 1] === '*') {
      i += 2;
      while (i < n) {
        if (src[i] === '*' && i + 1 < n && src[i + 1] === '/') { i += 2; break; }
        i++;
      }
      continue;
    }

    out += ch;
    i++;
  }

  // Second pass: remove trailing commas before } or ] outside strings
  let finalOut = '';
  inString = false;
  stringQuote = '';
  escaped = false;
  for (let j = 0; j < out.length; j++) {
    const c = out[j];
    if (inString) {
      finalOut += c;
      if (escaped) { escaped = false; }
      else if (c === '\\') { escaped = true; }
      else if (c === stringQuote) { inString = false; stringQuote = ''; }
      continue;
    }

    if (c === '"' || c === '\'') { inString = true; stringQuote = c as '"' | '\''; finalOut += c; continue; }

    if (c === ',') {
      // Lookahead past whitespace to next non-space char
      let k = j + 1;
      while (k < out.length && /\s/.test(out[k])) { k++; }
      const next = out[k];
      if (next === '}' || next === ']' || k >= out.length) {
        // Skip this comma (trailing comma before a closing token or end-of-input)
        continue;
      }
    }

    finalOut += c;
  }

  return finalOut.trim();
}