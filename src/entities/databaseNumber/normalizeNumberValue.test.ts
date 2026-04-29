import { describe, expect, it } from 'vitest';
import { normalizeNumberValue } from './normalizeNumberValue';

describe('normalizeNumberValue', () => {
  it('preserves empty values as undefined and parses numeric strings', () => {
    expect(normalizeNumberValue(undefined)).toBeUndefined();
    expect(normalizeNumberValue('')).toBeUndefined();
    expect(normalizeNumberValue('0')).toBe(0);
    expect(normalizeNumberValue('42')).toBe(42);
    expect(normalizeNumberValue('-1')).toBe(-1);
    expect(normalizeNumberValue('1.5')).toBe(1.5);
  });
});
