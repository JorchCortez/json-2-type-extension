import type { TypeShape } from './types.js';

export function hashShape(shape: TypeShape): string {
  return JSON.stringify(normalizeShape(shape));
}

function normalizeShape(shape: TypeShape): any {
  switch (shape.kind) {
    case "primitive":
      return {
        kind: shape.kind,
        primitiveType: shape.primitiveType,
        literalValue: shape.literalValue
      };
    
    case "null":
      return { kind: shape.kind };
    
    case "array":
      return {
        kind: shape.kind,
        arrayItemShape: shape.arrayItemShape ? normalizeShape(shape.arrayItemShape) : null
      };
    
    case "object":
      if (!shape.objectKeys) {return { kind: shape.kind, objectKeys: {} };}
      
      // Sort keys to ensure consistent hashing regardless of insertion order
      const sortedKeys: Record<string, any> = {};
      const keys = Object.keys(shape.objectKeys).sort();
      
      for (const key of keys) {
        const keyData = shape.objectKeys[key];
        sortedKeys[key] = {
          shape: normalizeShape(keyData.shape),
          optional: keyData.optional
        };
      }
      
      return {
        kind: shape.kind,
        objectKeys: sortedKeys
      };
    
    case "union":
      if (!shape.unionTypes) {return { kind: shape.kind, unionTypes: [] };}
      
      // Sort union types by their normalized representation for consistency
      const normalizedTypes = shape.unionTypes.map(normalizeShape);
      normalizedTypes.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      
      return {
        kind: shape.kind,
        unionTypes: normalizedTypes
      };
    
    default:
      return shape;
  }
}
