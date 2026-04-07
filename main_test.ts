import { isRange, isSemVer, parseRange } from '@std/semver';
import { assert, assertEquals, assertThrows } from '@std/assert';
import * as zod from '@zod/zod';

import { ExtendZodWithSemVer } from './main.ts';

const z = ExtendZodWithSemVer(zod);

Deno.test('z.semver parses valid semver and returns SemVer object', () => {
  const schema = z.semver();
  const result = schema.parse('0.0.1');
  assert(isSemVer(result), 'Expected parsed value to be a valid SemVer');
});

Deno.test('z.semver rejects non-string inputs', () => {
  const schema = z.semver();
  assertThrows(() => schema.parse(123));
});

Deno.test('notEquals rejects the exact deprecated version', () => {
  const schema = z.semver().notEquals('0.2.4');
  assert(isSemVer(schema.parse('0.2.3')), 'Expected 0.2.3 to be valid SemVer');
  assertThrows(() => schema.parse('0.2.4'));
});

Deno.test('greaterThan validates versions strictly greater', () => {
  const schema = z.semver().greaterThan('0.1.2');
  assert(isSemVer(schema.parse('0.1.3')), 'Expected 0.1.3 to be valid SemVer');
  assertThrows(() => schema.parse('0.1.2'));
});

Deno.test('greaterOrEqual validates versions greater or equal', () => {
  const schema = z.semver().greaterOrEqual('1.0.0');
  assert(isSemVer(schema.parse('1.0.0')), 'Expected 1.0.0 to be valid SemVer');
  assert(isSemVer(schema.parse('1.0.1')), 'Expected 1.0.1 to be valid SemVer');
  assertThrows(() => schema.parse('0.9.9'));
});

Deno.test('lessThan validates versions strictly less', () => {
  const schema = z.semver().lessThan('2.0.0');
  assert(isSemVer(schema.parse('1.9.9')), 'Expected 1.9.9 to be valid SemVer');
  assertThrows(() => schema.parse('2.0.0'));
});

Deno.test('lessOrEqual validates versions less or equal', () => {
  const schema = z.semver().lessOrEqual('2.0.0');
  assert(isSemVer(schema.parse('2.0.0')), 'Expected 2.0.0 to be valid SemVer');
  assert(isSemVer(schema.parse('1.9.9')), 'Expected 1.9.9 to be valid SemVer');
  assertThrows(() => schema.parse('2.0.1'));
});

Deno.test('satisfies validates semver ranges', () => {
  const rangeText = '1.2.7 || >=1.2.9 <2.0.0';
  const range = parseRange(rangeText);
  assert(isRange(range), 'Expected range text to parse as a valid range');

  const schema = z.semver().satisfies(rangeText);
  assert(isSemVer(schema.parse('1.2.9')), 'Expected 1.2.9 to be valid SemVer');
  assertThrows(() => schema.parse('2.0.0'));
});

Deno.test('schema is serializable with z.toJSONSchema', () => {
  const schema = z.semver();
  const jsonSchema = z.toJSONSchema(schema, { io: 'input' });
  assertEquals(jsonSchema.type, 'string');
});
