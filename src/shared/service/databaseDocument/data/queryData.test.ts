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

  it('treats $exists true as an effective-value check when a default makes the field present', () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    const itemIdList = queryIdList(
      {
        [itemId]: {},
      },
      {
        filter: {
          [titlePropertyId]: {
            $exists: true,
          },
        },
        properties,
      },
    );

    expect(itemIdList).toEqual([itemId]);
  });

  it('does not match $exists false when a property default makes the field effectively present', () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    const itemIdList = queryIdList(
      {
        [itemId]: {},
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

    expect(itemIdList).toEqual([]);
  });

  it('matches $exists false when there is no stored value and no default', () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        name: 'Title',
        type: 'string',
      },
    };

    const itemIdList = queryIdList(
      {
        [itemId]: {},
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

    expect(itemIdList).toEqual([itemId]);
  });

  it('matches $exists true when a stored explicit value is present', () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    const itemIdList = queryIdList(
      {
        [itemId]: {
          [titlePropertyId]: 'custom',
        },
      },
      {
        filter: {
          [titlePropertyId]: {
            $exists: true,
          },
        },
        properties,
      },
    );

    expect(itemIdList).toEqual([itemId]);
  });
});
