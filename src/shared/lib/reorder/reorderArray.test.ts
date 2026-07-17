import { describe, expect, it } from 'vitest';
import { generateViewId, type DatabaseViewId } from '@shared/lib/databaseDocument';
import type { ReorderCommitRequest } from './types';
import { isSameOrder, moveItem } from './reorderArray';

describe('moveItem', () => {
  it('relocates an item from one index to another', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns an equivalent list when the source index is out of range', () => {
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });

  it('preserves a branded item id type in the resulting reorder request, not widened to plain string', () => {
    // Compile-time only: this must type-check without a cast. If `moveItem` ever widened the
    // result to plain `string`, this assignment to a `DatabaseViewId`-typed request would fail.
    const expectedOrderedIds: readonly DatabaseViewId[] = [
      generateViewId(),
      generateViewId(),
      generateViewId(),
    ];
    const request: ReorderCommitRequest<DatabaseViewId> = {
      expectedOrderedIds,
      orderedIds: moveItem(expectedOrderedIds, 0, 2),
    };

    // A plain, arbitrary string array must not satisfy the branded request: proves the contract
    // still requires real branded ids rather than accepting any string once assigned through.
    const arbitraryStrings: string[] = ['not-a-view-id'];
    const assignArbitraryStringsAsOrderedIds = (): ReorderCommitRequest<DatabaseViewId> => ({
      expectedOrderedIds,
      // @ts-expect-error -- a plain string is not assignable to the branded DatabaseViewId array
      orderedIds: arbitraryStrings,
    });

    expect(request.orderedIds).toHaveLength(3);
    expect(typeof assignArbitraryStringsAsOrderedIds).toBe('function');
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
