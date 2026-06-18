import { describe, expect, it } from 'vitest';
import { getMDListItemHeights, MD_LIST_ITEM_MIN_HEIGHTS } from './listItemSizing';

describe('listItemSizing', () => {
  it('matches the Material 3 Expressive list row heights from the cache token table', () => {
    expect(MD_LIST_ITEM_MIN_HEIGHTS).toEqual({
      1: 56,
      2: 72,
      3: 88,
    });
    expect(getMDListItemHeights()).toEqual(MD_LIST_ITEM_MIN_HEIGHTS);
  });
});
