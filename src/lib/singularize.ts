const irregulars = new Map<string, string>([
  ['people', 'person'],
  ['children', 'child'],
  ['geese', 'goose'],
  ['mice', 'mouse'],
  ['men', 'man'],
  ['women', 'woman'],
  ['indices', 'index'],
  ['data', 'datum'],
  ['feet', 'foot'],
  ['teeth', 'tooth'],
  ['oxen', 'ox'],
  ['criteria', 'criterion'],
  ['phenomena', 'phenomenon'],
  ['analyses', 'analysis'],
  ['bases', 'basis'],
  ['crises', 'crisis'],
  ['hypotheses', 'hypothesis'],
  ['oases', 'oasis'],
  ['parentheses', 'parenthesis'],
  ['synopses', 'synopsis'],
  ['theses', 'thesis'],
  ['vertices', 'vertex'],
  ['matrices', 'matrix'],
  ['appendices', 'appendix'],
  ['codices', 'codex']
]);

const noSingularize = new Set([
  'status',
  'species',
  'news',
  'css',
  'series',
  'scissors',
  'glasses',
  'pants',
  'jeans',
  'shorts',
  'trousers',
  'headquarters',
  'means',
  'deer',
  'sheep',
  'fish',
  'aircraft',
  'spacecraft',
  'mathematics',
  'physics',
  'economics',
  'politics',
  'athletics',
  'gymnastics',
  'acoustics',
  'optics',
  'electronics',
  'dynamics',
  'statistics',
  'mechanics',
  'ethics',
  'semantics',
  'phonetics',
  'genetics'
]);

export function singularize(word: string, customOverrides: Map<string, string> = new Map()): string {
  const lower = word.toLowerCase();
  
  // Check custom overrides first
  if (customOverrides.has(lower)) {
    return preserveCase(customOverrides.get(lower)!, word);
  }
  
  // Check irregulars
  if (irregulars.has(lower)) {
    return preserveCase(irregulars.get(lower)!, word);
  }
  
  // Check no-singularize set
  if (noSingularize.has(lower)) {
    return word;
  }
  
  // Apply rules in order
  // Rule 1: words ending in -ies -> -y
  if (lower.endsWith('ies') && lower.length > 3) {
    return preserveCase(lower.slice(0, -3) + 'y', word);
  }
  
  // Rule 2: words ending in -xes, -ches, -shes, -sses, -zes -> drop -es
  if (/((xes|ches|shes|sses|zes))$/.test(lower)) {
    return preserveCase(lower.slice(0, -2), word);
  }
  
  // Rule 3: words ending in -s -> drop -s (unless ends in -ss)
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 1) {
    return preserveCase(lower.slice(0, -1), word);
  }
  
  return word;
}

function preserveCase(result: string, original: string): string {
  if (original.length === 0) return result;
  
  // If original was all uppercase, make result all uppercase
  if (original === original.toUpperCase()) {
    return result.toUpperCase();
  }
  
  // If original started with uppercase, capitalize result
  if (original[0] === original[0].toUpperCase()) {
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

export function createSingularizeWithOverrides(overrides: Map<string, string>) {
  return (word: string) => singularize(word, overrides);
}
