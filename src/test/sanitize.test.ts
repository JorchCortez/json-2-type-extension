import * as assert from 'assert';
import { sanitizeSelection, cleanJsonString } from '../lib/sanitize';
import { generateTypes } from '../lib/generator';

suite('Sanitize Selection', () => {
  test('Array assignment with semicolon', () => {
    const input = `let items = [\n  {"id": 1, "val": 100},\n  {"id": 2, "val": 380}\n];`;
    const sanitized = sanitizeSelection(input);
    assert.ok(sanitized.startsWith('[') && sanitized.endsWith(']'));
    const parsed = JSON.parse(cleanJsonString(sanitized));
    assert.ok(Array.isArray(parsed));

    const types = generateTypes(parsed, { rootName: 'rootType', extractObjects: true });
    assert.ok(types.includes('type rootTypeItem'));
    assert.ok(types.includes('type rootType = rootTypeItem[]'));
    assert.ok(types.includes('id: number;'));
    assert.ok(types.includes('val: number;'));
  });

  test('Export const with as const', () => {
    const input = `export const data = [{ "id": 1, "val": 2 }] as const;`;
    const sanitized = sanitizeSelection(input);
    assert.strictEqual(sanitized, `[{ "id": 1, "val": 2 }]`);
    const parsed = JSON.parse(cleanJsonString(sanitized));
    assert.ok(Array.isArray(parsed));

    const types = generateTypes(parsed, { rootName: 'rootType', extractObjects: true });
    assert.ok(types.includes('type rootTypeItem'));
    assert.ok(types.includes('type rootType = rootTypeItem[]'));
  });

  test('Parenthesized RHS', () => {
    const input = `const obj = ({ a: 1, b: true });`;
    const sanitized = sanitizeSelection(input);
    assert.strictEqual(sanitized, `({ a: 1, b: true })`.replace(/^\(/, '').replace(/\)$/, ''));
  });

  test('Single member selection is wrapped into object', () => {
    const input = `"questLog": { "Quest": [ { "id": 1 } ] }`;
    const sanitized = sanitizeSelection(input);
    assert.ok(sanitized.startsWith('{') && sanitized.endsWith('}'), 'Should be wrapped as an object');
    const parsed = JSON.parse(cleanJsonString(sanitized));
    assert.ok(parsed.questLog && Array.isArray(parsed.questLog.Quest), 'questLog.Quest should exist');
  });
});
