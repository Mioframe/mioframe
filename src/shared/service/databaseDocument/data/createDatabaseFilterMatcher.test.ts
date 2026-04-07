import { describe, expect, it } from 'vitest';
import {
  generatePropertyId,
  type DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument';
import { createDatabaseFilterMatcher } from './createDatabaseFilterMatcher';

describe('createDatabaseFilterMatcher', () => {
  it('supports nested root unary operators inside logical filters', () => {
    const titlePropertyId = generatePropertyId();
    const matcher = createDatabaseFilterMatcher(
      {
        $and: [
          {
            $eq: {
              [titlePropertyId]: 'match',
            },
          },
        ],
      },
      undefined,
    );

    expect(matcher({ [titlePropertyId]: 'match' })).toBe(true);
    expect(matcher({ [titlePropertyId]: 'miss' })).toBe(false);
  });

  it('checks $exists against effective values for properties with defaults', () => {
    const titlePropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    expect(
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: {
            $exists: true,
          },
        },
        properties,
      )({}),
    ).toBe(true);

    expect(
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: {
            $exists: false,
          },
        },
        properties,
      )({}),
    ).toBe(false);
  });

  it('checks $exists against effective values for properties without defaults', () => {
    const titlePropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        name: 'Title',
        type: 'string',
      },
    };

    expect(
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: {
            $exists: true,
          },
        },
        properties,
      )({}),
    ).toBe(false);

    expect(
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: {
            $exists: false,
          },
        },
        properties,
      )({}),
    ).toBe(true);
  });

  it('applies $exists and other unary operators as an AND over effective values', () => {
    const titlePropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    expect(
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: {
            $eq: 'untitled',
            $exists: true,
          },
        },
        properties,
      )({}),
    ).toBe(true);

    expect(
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: {
            $eq: 'custom',
            $exists: true,
          },
        },
        properties,
      )({}),
    ).toBe(false);

    expect(
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: {
            $eq: 'untitled',
            $exists: false,
          },
        },
        properties,
      )({}),
    ).toBe(false);
  });

  it('does not let $exists bypass other unary operators for stored values', () => {
    const titlePropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        name: 'Title',
        type: 'string',
      },
    };
    const matcher = createDatabaseFilterMatcher(
      {
        [titlePropertyId]: {
          $eq: 'match',
          $exists: true,
        },
      },
      properties,
    );

    expect(matcher({ [titlePropertyId]: 'match' })).toBe(true);
    expect(matcher({ [titlePropertyId]: 'miss' })).toBe(false);
  });

  it('preserves the usual stored-value case without defaults', () => {
    const titlePropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        name: 'Title',
        type: 'string',
      },
    };
    const matcher = createDatabaseFilterMatcher(
      {
        [titlePropertyId]: {
          $eq: 'stored',
        },
      },
      properties,
    );

    expect(matcher({ [titlePropertyId]: 'stored' })).toBe(true);
    expect(matcher({ [titlePropertyId]: 'other' })).toBe(false);
    expect(matcher({})).toBe(false);
  });

  it('rejects invalid field conditions instead of masking them as empty', () => {
    const titlePropertyId = generatePropertyId();

    expect(() =>
      createDatabaseFilterMatcher(
        {
          [titlePropertyId]: 'invalid',
        },
        undefined,
      ),
    ).toThrowError('Database field condition must be an operator record');
  });
});
