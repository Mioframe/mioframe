import { describe, expect, it } from 'vitest';
import { generatePropertyId } from '@shared/lib/databaseDocument';
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

  it('keeps invalid field conditions compatible by treating them as empty conditions', () => {
    const titlePropertyId = generatePropertyId();
    const matcher = createDatabaseFilterMatcher(
      {
        [titlePropertyId]: 'invalid',
      },
      undefined,
    );

    expect(matcher({})).toBe(true);
    expect(matcher({ [titlePropertyId]: 'value' })).toBe(true);
  });
});
