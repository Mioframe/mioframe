import { describe, expect, it } from 'vitest';
import {
  generateItemId,
  generatePropertyId,
  type DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument';
import { queryIdList } from './queryData';

describe('queryIdList', () => {
  it('matches sparse items through property defaults in filters', () => {
    const donePropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const properties: DatabaseUnknownPropertiesMap = {
      [donePropertyId]: {
        default: false,
        name: 'Done',
        type: 'boolean',
      },
    };

    const itemIdList = queryIdList(
      {
        [firstItemId]: {},
        [secondItemId]: { [donePropertyId]: true },
      },
      {
        filter: {
          [donePropertyId]: {
            $eq: false,
          },
        },
        properties,
      },
    );

    expect(itemIdList).toEqual([firstItemId]);
  });

  it('preserves missing-key semantics for properties without defaults', () => {
    const titlePropertyId = generatePropertyId();
    const firstItemId = generateItemId();
    const secondItemId = generateItemId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        name: 'Title',
        type: 'string',
      },
    };

    const itemIdList = queryIdList(
      {
        [firstItemId]: {},
        [secondItemId]: { [titlePropertyId]: 'filled' },
      },
      {
        filter: {
          [titlePropertyId]: {
            $exists: false,
          },
        },
        properties,
      },
    );

    expect(itemIdList).toEqual([firstItemId]);
  });
});
