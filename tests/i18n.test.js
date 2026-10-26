import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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
});
