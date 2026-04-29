import { describe, expect, it } from 'vitest';
import {
  SORT_DIRECTION,
  generateItemId,
  generatePropertyId,
  type DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument';
import { sortData } from './sortData';

describe('sortData', () => {
  it('preserves the original entry order when no sorting is configured', () => {
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const thirdItemId = generateItemId();

    const sorted = sortData([
      [firstItemId, {}],
      [secondItemId, {}],
      [thirdItemId, {}],
    ]);

    expect(sorted.map(([id]) => id)).toEqual([firstItemId, secondItemId, thirdItemId]);
  });

  it('sorts missing string values consistently without falling back to item id', () => {
    const titlePropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const lowerItemId = firstItemId < secondItemId ? firstItemId : secondItemId;
    const higherItemId = firstItemId < secondItemId ? secondItemId : firstItemId;

    const sorted = sortData(
      [
        [lowerItemId, { [titlePropertyId]: 'z' }],
        [higherItemId, {}],
      ],
      {
        [titlePropertyId]: {
          direction: SORT_DIRECTION.ascending,
          priority: 0,
        },
      },
    );

    expect(sorted.map(([id]) => id)).toEqual([higherItemId, lowerItemId]);
  });

  it('sorts missing number values consistently without falling back to item id', () => {
    const countPropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const lowerItemId = firstItemId < secondItemId ? firstItemId : secondItemId;
    const higherItemId = firstItemId < secondItemId ? secondItemId : firstItemId;

    const sorted = sortData(
      [
        [lowerItemId, { [countPropertyId]: 3 }],
        [higherItemId, {}],
      ],
      {
        [countPropertyId]: {
          direction: SORT_DIRECTION.ascending,
          priority: 0,
        },
      },
    );

    expect(sorted.map(([id]) => id)).toEqual([higherItemId, lowerItemId]);
  });

  it('sorts sparse items using property defaults', () => {
    const titlePropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'a',
        name: 'Title',
        type: 'string',
      },
    };

    const sorted = sortData(
      [
        [secondItemId, {}],
        [firstItemId, { [titlePropertyId]: 'z' }],
      ],
      {
        [titlePropertyId]: {
          direction: SORT_DIRECTION.ascending,
          priority: 0,
        },
      },
      properties,
    );

    expect(sorted.map(([id]) => id)).toEqual([secondItemId, firstItemId]);
  });

  it('falls back to item id ascending when effective values are equal', () => {
    const titlePropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const lowerItemId = firstItemId < secondItemId ? firstItemId : secondItemId;
    const higherItemId = firstItemId < secondItemId ? secondItemId : firstItemId;
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'x',
        name: 'Title',
        type: 'string',
      },
    };

    const sorted = sortData(
      [
        [higherItemId, { [titlePropertyId]: 'x' }],
        [lowerItemId, {}],
      ],
      {
        [titlePropertyId]: {
          direction: SORT_DIRECTION.ascending,
          priority: 0,
        },
      },
      properties,
    );

    expect(sorted.map(([id]) => id)).toEqual([lowerItemId, higherItemId]);
  });

  it('uses deterministic stringify for complex fallback values before item id tie-breaks', () => {
    const metaPropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const lowerItemId = firstItemId < secondItemId ? firstItemId : secondItemId;
    const higherItemId = firstItemId < secondItemId ? secondItemId : firstItemId;

    const sorted = sortData(
      [
        [higherItemId, { [metaPropertyId]: { b: 2, a: 1 } }],
        [lowerItemId, { [metaPropertyId]: { a: 1, b: 2 } }],
      ],
      {
        [metaPropertyId]: {
          direction: SORT_DIRECTION.ascending,
          priority: 0,
        },
      },
    );

    expect(sorted.map(([id]) => id)).toEqual([lowerItemId, higherItemId]);
  });

  it('sorts missing complex values consistently before deterministic stringify values', () => {
    const metaPropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const lowerItemId = firstItemId < secondItemId ? firstItemId : secondItemId;
    const higherItemId = firstItemId < secondItemId ? secondItemId : firstItemId;

    const sorted = sortData(
      [
        [lowerItemId, { [metaPropertyId]: { z: 1 } }],
        [higherItemId, {}],
      ],
      {
        [metaPropertyId]: {
          direction: SORT_DIRECTION.ascending,
          priority: 0,
        },
      },
    );

    expect(sorted.map(([id]) => id)).toEqual([higherItemId, lowerItemId]);
  });
});
