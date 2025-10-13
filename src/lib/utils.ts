export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

export function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) && !isReservedWord(name);
}

export function isReservedWord(word: string): boolean {
  const reserved = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally',
    'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null',
    'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
    'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements',
    'interface', 'package', 'private', 'protected', 'public', 'abstract',
    'as', 'async', 'await', 'declare', 'from', 'get', 'is', 'keyof',
    'module', 'namespace', 'never', 'readonly', 'require', 'set', 'type',
    'unique', 'unknown', 'any', 'boolean', 'number', 'string', 'symbol',
    'object', 'undefined'
  ]);
  return reserved.has(word);
}

export function quoteKey(key: string, quote: "single" | "double" = "single"): string {
  if (isValidIdentifier(key)) {
    return key;
  }
  const q = quote === "single" ? "'" : '"';
  const escaped = key.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q);
  return `${q}${escaped}${q}`;
}

export function makeTypeName(base: string, suffix = "Type"): string {
  const camelCased = toCamelCase(base);
  return camelCased + suffix;
}

export function ensureUnique(name: string, usedNames: Set<string>): string {
  let candidate = name;
  let counter = 2;
  
  while (usedNames.has(candidate)) {
    candidate = `${name}${counter}`;
    counter++;
  }
  
  return candidate;
}
