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
  return jsonString
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before closing braces and brackets
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .trim();
}