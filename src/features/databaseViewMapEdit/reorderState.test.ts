import { describe, expect, it } from 'vitest';
import { arrayMove, arraysEqual, normalizeDisplayOrder } from './reorderState';

describe('arrayMove', () => {
  it('moves an item forward in the list', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward in the list', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns an equivalent list when from and to are the same index', () => {
    expect(arrayMove(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input list', () => {
    const input = ['a', 'b', 'c'];

    arrayMove(input, 0, 2);

    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('returns an unchanged copy when from is out of range', () => {
    expect(arrayMove(['a', 'b', 'c'], 5, 0)).toEqual(['a', 'b', 'c']);
  });
});

describe('arraysEqual', () => {
  it('returns true for identical ordered lists', () => {
    expect(arraysEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
  });

  it('returns false when order differs', () => {
    expect(arraysEqual(['a', 'b', 'c'], ['a', 'c', 'b'])).toBe(false);
  });

  it('returns false when length differs', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });
});

describe('normalizeDisplayOrder', () => {
  it('returns the canonical order when no pending order is active', () => {
    expect(normalizeDisplayOrder(null, ['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('returns the pending order unchanged when membership matches canonical exactly', () => {
    expect(normalizeDisplayOrder(['c', 'a', 'b'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
  });

  it('drops ids from the pending order that no longer exist in canonical', () => {
    expect(normalizeDisplayOrder(['c', 'a', 'b'], ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('appends new canonical ids not present in the pending order, in canonical order', () => {
    expect(normalizeDisplayOrder(['b', 'a'], ['a', 'b', 'c', 'd'])).toEqual(['b', 'a', 'c', 'd']);
  });

  it('handles simultaneous removal and addition against canonical membership', () => {
    expect(normalizeDisplayOrder(['c', 'a', 'b'], ['a', 'd'])).toEqual(['a', 'd']);
  });
});
