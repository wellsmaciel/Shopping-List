import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const { UNITS } = createRequire(import.meta.url)('../lib/units');

// Every `code` the API can put in an error body (plus one for network failures).
const ERROR_CODES = ['invalid_name', 'invalid_quantity', 'invalid_unit', 'invalid_id', 'invalid_in_cart', 'invalid_json', 'not_found', 'server_error'];

const load = (language) =>
  JSON.parse(readFileSync(new URL(`../public/i18n/${language}.json`, import.meta.url), 'utf8'));

describe('Interface Language files', () => {
  const en = load('en');
  const ga = load('ga');

  it('have identical key sets', () => {
    expect(Object.keys(ga).sort()).toEqual(Object.keys(en).sort());
  });

  it('have no empty values', () => {
    for (const dictionary of [en, ga]) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(typeof value, key).toBe('string');
        expect(value.trim(), key).not.toBe('');
      }
    }
  });

  it('have a label for every Unit code', () => {
    for (const dictionary of [en, ga]) {
      for (const code of UNITS) {
        expect(dictionary, `unit.${code}`).toHaveProperty(`unit.${code}`);
      }
    }
  });

  it('have a message for every error code and for network failures', () => {
    for (const dictionary of [en, ga]) {
      for (const code of [...ERROR_CODES, 'network']) {
        expect(dictionary, `error.${code}`).toHaveProperty(`error.${code}`);
      }
    }
  });
});
