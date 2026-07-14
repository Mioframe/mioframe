import { describe, expect, it } from 'vitest';
import { isSameOrder, moveItem } from './reorderArray';

describe('moveItem', () => {
  it('relocates an item from one index to another', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns an equivalent list when the source index is out of range', () => {
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
});

describe('isSameOrder', () => {
  it('is true for identical ordered lists', () => {
    expect(isSameOrder(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  it('is false for different order', () => {
    expect(isSameOrder(['a', 'b'], ['b', 'a'])).toBe(false);
  });

  it('is false for different length', () => {
    expect(isSameOrder(['a'], ['a', 'b'])).toBe(false);
  });
});
