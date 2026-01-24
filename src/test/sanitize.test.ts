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

  test('Does not strip // inside strings (e.g., http://)', () => {
    const input = `{"picture": "http://placehold.it/32x32", "ok": true}`;
    const sanitized = sanitizeSelection(input);
    const cleaned = cleanJsonString(sanitized);
    const parsed = JSON.parse(cleaned);
    assert.strictEqual((parsed as any).picture, 'http://placehold.it/32x32');
    assert.strictEqual((parsed as any).ok, true);
  });

  test('Removes trailing comma at end-of-input for object', () => {
    const input = `{
      "name": "Pam",
      "description": "The Strong Stuff"
    },`;
    const sanitized = sanitizeSelection(input);
    const cleaned = cleanJsonString(sanitized);
    const parsed = JSON.parse(cleaned);
    assert.strictEqual((parsed as any).name, 'Pam');
    assert.strictEqual((parsed as any).description, 'The Strong Stuff');
  });

  test('Removes trailing comma before closing bracket in array', () => {
    const input = `let arr = [
      { "id": 1 },
    ];`;
    const sanitized = sanitizeSelection(input);
    const cleaned = cleanJsonString(sanitized);
    const parsed = JSON.parse(cleaned);
    assert.ok(Array.isArray(parsed));
    assert.strictEqual((parsed as any)[0].id, 1);
  });
});
