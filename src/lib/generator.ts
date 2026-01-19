import type { GenerateOptions, TypeShape, GeneratedType, TypeRegistry } from './types';
import { singularize } from './singularize';
import { hashShape } from './hash';
import { makeTypeName, ensureUnique, quoteKey } from './utils';

const defaultOptions: Required<GenerateOptions> = {
  rootName: 'rootType',
  singularize: true,
  literalThreshold: 0,
  nullAsOptional: false,
  indent: 2,
  quote: 'single',
  extractObjects: false
};

export function generateTypes(input: unknown, options: GenerateOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  // Ensure root name ends with "Type" and is camelCase
  let rootName = opts.rootName;
  if (!rootName.endsWith('Type')) {
    rootName = makeTypeName(rootName, 'Type');
  }
  
  const registry: TypeRegistry = {
    types: new Map(),
    shapeToName: new Map(),
    usedNames: new Set()
  };
  
  // Analyze the input to create type shapes
  const rootShape = analyzeValue(input, opts);
  
  // Generate types from shapes
  const rootTypeDefinition = generateTypeFromShape(rootShape, rootName, registry, opts);
  
  // Build output
  const lines: string[] = [];
  
  // Topologically sort types (best effort - complex dependencies might not be perfect)
  const sortedTypes = topologicalSort(registry);

  // Always start with the root type at the top
  if (registry.types.has(rootName)) {
    const root = registry.types.get(rootName)!;
    lines.push(`type ${root.name} = ${root.definition};`);
    lines.push('');
    // Then add the rest excluding the root
    for (const type of sortedTypes) {
      if (type.name === rootName) {continue;}
      lines.push(`type ${type.name} = ${type.definition};`);
      lines.push('');
    }
  } else {
    // Root is a primitive/array/union inline definition
    lines.push(`type ${rootName} = ${rootTypeDefinition};`);
    lines.push('');
    // Then any extracted object types (if any)
    for (const type of sortedTypes) {
      lines.push(`type ${type.name} = ${type.definition};`);
      lines.push('');
    }
  }
  
  // Remove last empty line
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  
  return lines.join('\n');
}

function analyzeValue(value: unknown, opts: Required<GenerateOptions>): TypeShape {
  if (value === null) {
    return { kind: 'null' };
  }
  
  if (typeof value === 'string') {
    // Only store literal value if we might use it for literal unions
    if (opts.literalThreshold > 0) {
      return { kind: 'primitive', primitiveType: 'string', literalValue: value };
    }
    return { kind: 'primitive', primitiveType: 'string' };
  }
  
  if (typeof value === 'number') {
    // Only store literal value if we might use it for literal unions
    if (opts.literalThreshold > 0) {
      return { kind: 'primitive', primitiveType: 'number', literalValue: value };
    }
    return { kind: 'primitive', primitiveType: 'number' };
  }
  
  if (typeof value === 'boolean') {
    // Only store literal value if we might use it for literal unions
    if (opts.literalThreshold > 0) {
      return { kind: 'primitive', primitiveType: 'boolean', literalValue: value };
    }
    return { kind: 'primitive', primitiveType: 'boolean' };
  }
  
  if (Array.isArray(value)) {
    return analyzeArray(value, opts);
  }
  
  if (typeof value === 'object') {
    return analyzeObject(value as Record<string, unknown>, opts);
  }
  
  // Fallback for undefined, functions, symbols, etc.
  return { kind: 'primitive', primitiveType: 'string' };
}

function analyzeArray(array: unknown[], opts: Required<GenerateOptions>): TypeShape {
  if (array.length === 0) {
    return {
      kind: 'array',
      arrayItemShape: { kind: 'primitive', primitiveType: 'string' } // any[] equivalent
    };
  }
  
  // Categorize array items
  const objects: Record<string, unknown>[] = [];
  const primitives: unknown[] = [];
  const arrays: unknown[][] = [];
  const nulls: null[] = [];
  
  for (const item of array) {
    if (item === null) {
      nulls.push(item);
    } else if (Array.isArray(item)) {
      arrays.push(item);
    } else if (typeof item === 'object') {
      objects.push(item as Record<string, unknown>);
    } else {
      primitives.push(item);
    }
  }
  
  const shapes: TypeShape[] = [];
  
  // Handle primitives
  if (primitives.length > 0) {
    shapes.push(...getPrimitiveShapes(primitives, opts));
  }
  
  // Handle nulls
  if (nulls.length > 0) {
    shapes.push({ kind: 'null' });
  }
  
  // Handle arrays
  for (const subArray of arrays) {
    shapes.push(analyzeArray(subArray, opts));
  }
  
  // Handle objects - merge similar shapes
  if (objects.length > 0) {
    const mergedShape = mergeObjectShapes(objects.map(obj => analyzeObject(obj, opts)), opts);
    shapes.push(mergedShape);
  }
  
  // Create union if multiple different types
  let itemShape: TypeShape;
  if (shapes.length === 1) {
    itemShape = shapes[0];
  } else {
    itemShape = { kind: 'union', unionTypes: shapes };
  }
  
  return {
    kind: 'array',
    arrayItemShape: itemShape
  };
}

function analyzeObject(obj: Record<string, unknown>, opts: Required<GenerateOptions>): TypeShape {
  const objectKeys: Record<string, { shape: TypeShape; optional: boolean }> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    objectKeys[key] = {
      shape: analyzeValue(value, opts),
      optional: false // Single object analysis - not optional initially
    };
  }
  
  return {
    kind: 'object',
    objectKeys
  };
}

function mergeObjectShapes(shapes: TypeShape[], opts?: Required<GenerateOptions>): TypeShape {
  if (shapes.length === 0) {
    return { kind: 'object', objectKeys: {} };
  }
  
  if (shapes.length === 1) {
    return shapes[0];
  }
  
  // Collect all keys across all shapes
  const allKeys = new Set<string>();
  for (const shape of shapes) {
    if (shape.kind === 'object' && shape.objectKeys) {
      for (const key of Object.keys(shape.objectKeys)) {
        allKeys.add(key);
      }
    }
  }
  
  const mergedKeys: Record<string, { shape: TypeShape; optional: boolean }> = {};
  
  for (const key of allKeys) {
    const keyShapes: TypeShape[] = [];
    let presentCount = 0;
    
    for (const shape of shapes) {
      if (shape.kind === 'object' && shape.objectKeys && shape.objectKeys[key]) {
        keyShapes.push(shape.objectKeys[key].shape);
        presentCount++;
      }
    }
    
    // Key is optional if it's missing in any object
    const optional = presentCount < shapes.length;
    
    // Create consolidated shape for this key
    let keyShape: TypeShape;
    if (keyShapes.length === 1) {
      keyShape = keyShapes[0];
    } else {
      // Try to consolidate similar shapes - this is crucial for reducing unions
      keyShape = consolidateShapes(keyShapes, opts);
    }
    
    mergedKeys[key] = { shape: keyShape, optional };
  }
  
  return {
    kind: 'object',
    objectKeys: mergedKeys
  };
}

function consolidateShapes(shapes: TypeShape[], opts?: Required<GenerateOptions>): TypeShape {
  if (shapes.length === 1) {
    return shapes[0];
  }
  
  // Group shapes by their structural type
  const primitiveShapes = shapes.filter(s => s.kind === 'primitive');
  const objectShapes = shapes.filter(s => s.kind === 'object');
  const arrayShapes = shapes.filter(s => s.kind === 'array');
  const nullShapes = shapes.filter(s => s.kind === 'null');
  
  const consolidatedShapes: TypeShape[] = [];
  
  // Consolidate primitives by type
  if (primitiveShapes.length > 0) {
    const stringShapes = primitiveShapes.filter(s => s.primitiveType === 'string');
    const numberShapes = primitiveShapes.filter(s => s.primitiveType === 'number');
    const booleanShapes = primitiveShapes.filter(s => s.primitiveType === 'boolean');
    
    if (stringShapes.length > 0) {
      consolidatedShapes.push(consolidatePrimitiveShapes('string', stringShapes, opts));
    }
    if (numberShapes.length > 0) {
      consolidatedShapes.push(consolidatePrimitiveShapes('number', numberShapes, opts));
    }
    if (booleanShapes.length > 0) {
      consolidatedShapes.push(consolidatePrimitiveShapes('boolean', booleanShapes, opts));
    }
  }
  
  // Try to consolidate object shapes with same structure
  if (objectShapes.length > 1) {
    const consolidatedObject = mergeObjectShapes(objectShapes, opts);
    consolidatedShapes.push(consolidatedObject);
  } else if (objectShapes.length === 1) {
    consolidatedShapes.push(objectShapes[0]);
  }
  
  // Add array shapes as-is for now
  consolidatedShapes.push(...arrayShapes);
  
  if (nullShapes.length > 0) {
    consolidatedShapes.push({ kind: 'null' });
  }
  
  if (consolidatedShapes.length === 1) {
    return consolidatedShapes[0];
  }
  
  return { kind: 'union', unionTypes: consolidatedShapes };
}

function consolidatePrimitiveShapes(type: 'string' | 'number' | 'boolean', shapes: TypeShape[], opts?: Required<GenerateOptions>): TypeShape {
  // Extract all literal values
  const values = shapes.map(s => s.literalValue).filter(v => v !== undefined);
  const uniqueValues = [...new Set(values)];
  
  if (opts && opts.literalThreshold > 0 && uniqueValues.length <= opts.literalThreshold) {
    return {
      kind: 'union',
      unionTypes: uniqueValues.map(val => ({ kind: 'primitive', primitiveType: type, literalValue: val }))
    };
  }
  
  // Consolidate to primitive type
  return { kind: 'primitive', primitiveType: type };
}

function getPrimitiveShapes(primitives: unknown[], opts: Required<GenerateOptions>): TypeShape[] {
  const stringValues: string[] = [];
  const numberValues: number[] = [];
  const booleanValues: boolean[] = [];
  
  for (const primitive of primitives) {
    if (typeof primitive === 'string') {
      stringValues.push(primitive);
    } else if (typeof primitive === 'number') {
      numberValues.push(primitive);
    } else if (typeof primitive === 'boolean') {
      booleanValues.push(primitive);
    }
  }
  
  const shapes: TypeShape[] = [];
  
  if (stringValues.length > 0) {
    shapes.push(createPrimitiveShape('string', stringValues, opts));
  }
  
  if (numberValues.length > 0) {
    shapes.push(createPrimitiveShape('number', numberValues, opts));
  }
  
  if (booleanValues.length > 0) {
    shapes.push(createPrimitiveShape('boolean', booleanValues, opts));
  }
  
  return shapes;
}

function createPrimitiveShape(type: 'string' | 'number' | 'boolean', values: (string | number | boolean)[], opts: Required<GenerateOptions>): TypeShape {
  if (opts.literalThreshold > 0) {
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length <= opts.literalThreshold) {
      // Return union of literal types
      return {
        kind: 'union',
        unionTypes: uniqueValues.map(val => ({ kind: 'primitive', primitiveType: type, literalValue: val }))
      };
    }
  }
  
  return { kind: 'primitive', primitiveType: type };
}

function shouldInlineObject(shape: TypeShape, opts: Required<GenerateOptions>): boolean {
  if (shape.kind !== 'object' || !shape.objectKeys) {
    return false;
  }
  
  // If extractObjects is enabled, never inline object types
  if (opts.extractObjects) {
    return false;
  }
  
  const keys = Object.keys(shape.objectKeys);
  
  // Inline very simple objects (1-2 keys with primitive values)
  if (keys.length <= 2) {
    return keys.every(key => {
      const keyData = shape.objectKeys![key];
      return keyData.shape.kind === 'primitive' || keyData.shape.kind === 'null';
    });
  }
  
  return false;
}

function generateTypeFromShape(shape: TypeShape, suggestedName: string, registry: TypeRegistry, opts: Required<GenerateOptions>): string {
  // Check if we've already generated this shape
  const shapeHash = hashShape(shape);
  if (registry.shapeToName.has(shapeHash)) {
    return registry.shapeToName.get(shapeHash)!;
  }
  
  switch (shape.kind) {
    case 'primitive':
      return formatPrimitiveType(shape, opts);
    
    case 'null':
      return 'null';
    
    case 'array':
      const itemType = generateTypeFromShape(shape.arrayItemShape!, `${suggestedName}Item`, registry, opts);
      return `${itemType}[]`;
    
    case 'union':
      if (!shape.unionTypes || shape.unionTypes.length === 0) {
        return 'never';
      }
      const unionTypes = shape.unionTypes.map((unionShape, index) => 
        generateTypeFromShape(unionShape, `${suggestedName}Union${index}`, registry, opts)
      );
      // Deduplicate union types and sort alphabetically for consistency
      const uniqueUnionTypes = [...new Set(unionTypes)];
      if (uniqueUnionTypes.length === 1) {
        return uniqueUnionTypes[0];
      }
      return uniqueUnionTypes.sort().join(' | ');
    
    case 'object':
      // Check if this is a simple object that should be inlined
      if (shouldInlineObject(shape, opts)) {
        return formatObjectType(shape, '', registry, opts);
      }
      
      // This is a complex object that needs its own type
      const typeName = ensureUnique(suggestedName, registry.usedNames);
      registry.usedNames.add(typeName);
      registry.shapeToName.set(shapeHash, typeName);
      
      const definition = formatObjectType(shape, typeName, registry, opts);
      const generatedType: GeneratedType = {
        name: typeName,
        definition,
        dependencies: new Set() // TODO: track dependencies for better sorting
      };
      
      registry.types.set(typeName, generatedType);
      return typeName;
    
    default:
      return 'unknown';
  }
}

function formatPrimitiveType(shape: TypeShape, opts: Required<GenerateOptions>): string {
  if (shape.literalValue !== undefined) {
    if (typeof shape.literalValue === 'string') {
      const quote = opts.quote === 'single' ? "'" : '"';
      const escaped = shape.literalValue.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), '\\' + quote);
      return `${quote}${escaped}${quote}`;
    }
    return String(shape.literalValue);
  }
  
  return shape.primitiveType || 'unknown';
}

function formatObjectType(shape: TypeShape, _typeName: string, registry: TypeRegistry, opts: Required<GenerateOptions>): string {
  if (!shape.objectKeys || Object.keys(shape.objectKeys).length === 0) {
    return '{}';
  }
  
  const parts: string[] = [];
  const indent = ' '.repeat(opts.indent);
  
  // Sort keys for consistent output
  const keys = Object.keys(shape.objectKeys).sort();
  
  for (const key of keys) {
    const keyData = shape.objectKeys[key];
    const quotedKey = quoteKey(key, opts.quote);
    const optional = keyData.optional ? '?' : '';
    
    // Generate type name for nested objects
    let nestedTypeName = key;
    if (opts.singularize) {
      nestedTypeName = singularize(key);
    }
    nestedTypeName = makeTypeName(nestedTypeName);
    
    const keyType = generateTypeFromShape(keyData.shape, nestedTypeName, registry, opts);
    
    if (opts.nullAsOptional && keyType.includes('null')) {
      // Remove null from union and make key optional
      const cleanType = keyType.replace(/\s*\|\s*null/g, '').replace(/null\s*\|\s*/g, '');
      parts.push(`${indent}${quotedKey}?: ${cleanType};`);
    } else {
      parts.push(`${indent}${quotedKey}${optional}: ${keyType};`);
    }
  }
  
  return `{\n${parts.join('\n')}\n}`;
}

function topologicalSort(registry: TypeRegistry): GeneratedType[] {
  // Simple approach: just return types in order they were created
  // A more sophisticated implementation would track dependencies and sort accordingly
  return Array.from(registry.types.values());
}

export type { GenerateOptions } from './types.js';
