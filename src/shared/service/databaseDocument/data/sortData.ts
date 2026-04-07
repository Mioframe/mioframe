import type {
  DatabaseData,
  DatabaseItem,
  DatabaseItemId,
  DatabaseSortMap,
  DatabaseSortDescription,
  DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument';
import { SORT_DIRECTION } from '@shared/lib/databaseDocument';
import { getDatabaseEffectiveValue } from '@shared/lib/databaseDocument';
import type { RecordEntries } from '@shared/lib/objectEntries';
import { recordEntries } from '@shared/lib/objectEntries';
import { isArray } from 'es-toolkit/compat';
import stringify from 'safe-stable-stringify';
import { partialSort } from './partialSort';

const resolveComparableValue = (value: unknown): boolean | number | string => {
  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return stringify(value);
};

const compareValues = (
  a: unknown,
  b: unknown,
  direction: DatabaseSortDescription['direction'],
) => {
  const resolvedDirection = direction === SORT_DIRECTION.ascending ? 1 : -1;
  const resolvedA = resolveComparableValue(a);
  const resolvedB = resolveComparableValue(b);

  return resolvedA < resolvedB
    ? -resolvedDirection
    : resolvedA > resolvedB
      ? resolvedDirection
      : 0;
};

export const sortData = (
  data: DatabaseData | RecordEntries<DatabaseData>,
  sorting?: DatabaseSortMap,
  properties?: DatabaseUnknownPropertiesMap,
  firstIndex?: number,
  lastIndex?: number,
): RecordEntries<DatabaseData> => {
  const entries = isArray(data) ? data : recordEntries(data);

  if (!sorting) {
    return partialSort(
      entries,
      undefined,
      firstIndex ?? 0,
      lastIndex ?? entries.length - 1,
    );
  }

  const orderedSortingEntries = recordEntries(sorting).sort(
    ([, { priority: a }], [, { priority: b }]) => a - b,
  );
  const compareEntries = (
    [aItemId, aItem]: [DatabaseItemId, DatabaseItem],
    [bItemId, bItem]: [DatabaseItemId, DatabaseItem],
  ) => {
    for (const [propertyId, { direction }] of orderedSortingEntries) {
      const aValue = properties
        ? getDatabaseEffectiveValue(aItem, propertyId, properties[propertyId])
        : aItem[propertyId];
      const bValue = properties
        ? getDatabaseEffectiveValue(bItem, propertyId, properties[propertyId])
        : bItem[propertyId];
      const valueCompare = compareValues(aValue ?? -1, bValue ?? -1, direction);

      if (valueCompare !== 0) {
        return valueCompare;
      }
    }

    return compareValues(aItemId, bItemId, SORT_DIRECTION.ascending);
  };

  const sortResult = partialSort(
    entries,
    undefined,
    firstIndex ?? 0,
    lastIndex ?? entries.length - 1,
    compareEntries,
  );

  return sortResult;
};
