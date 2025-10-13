export interface GenerateOptions {
  rootName?: string;
  singularize?: boolean;
  literalThreshold?: number;
  nullAsOptional?: boolean;
  indent?: number;
  quote?: "single" | "double";
  extractObjects?: boolean;
}

export interface TypeShape {
  kind: "primitive" | "object" | "array" | "union" | "null";
  primitiveType?: "string" | "number" | "boolean";
  objectKeys?: Record<string, { shape: TypeShape; optional: boolean }>;
  arrayItemShape?: TypeShape;
  unionTypes?: TypeShape[];
  literalValue?: string | number | boolean;
}

export interface GeneratedType {
  name: string;
  definition: string;
  dependencies: Set<string>;
}

export interface TypeRegistry {
  types: Map<string, GeneratedType>;
  shapeToName: Map<string, string>;
  usedNames: Set<string>;
}
