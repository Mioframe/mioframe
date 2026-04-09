import type {
  DatabaseData,
  DatabaseFilter,
  DatabaseItem,
  DatabaseItemId,
  DatabaseSortMap,
  DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument';
import type { RecordEntries } from '@shared/lib/objectEntries';
import { recordEntries } from '@shared/lib/objectEntries';
import { isArray } from 'es-toolkit/compat';
import type { Query } from 'sift';
import sift from 'sift';
import { createDatabaseFilterMatcher } from './createDatabaseFilterMatcher';
import { sortData } from './sortData';

export const queryIdList = <TSchemaItem extends DatabaseItem = DatabaseItem>(
  data: DatabaseData | RecordEntries<DatabaseData>,
  {
    idQuery,
    itemQuery,
    slice: { first, last } = {},
    sorting,
    filter,
    properties,
  }: {
    itemQuery?: Query<TSchemaItem>;
    idQuery?: Query<DatabaseItemId>;
    sorting?: DatabaseSortMap;
    filter?: DatabaseFilter;
    properties?: DatabaseUnknownPropertiesMap;
    slice?: {
      first?: number;
      last?: number;
    };
  },
): DatabaseItemId[] => {
  const entries = isArray(data) ? data : recordEntries(data);
  const matchId = idQuery ? sift(idQuery) : undefined;
  const matchItem = itemQuery ? sift(itemQuery) : undefined;
  const matchFilter = filter ? createDatabaseFilterMatcher(filter, properties) : undefined;

  const filteredEntries =
    itemQuery || idQuery || filter
      ? entries.filter(([id, item]) => {
          return (
            (matchId ? matchId(id) : true) &&
            (matchItem ? matchItem(item) : true) &&
            (matchFilter ? matchFilter(item) : true)
          );
        })
      : entries;

  const sortedEntries = sortData(filteredEntries, sorting, properties, first, last);

  const itemIdList = sortedEntries.map(([id]) => id);

  return itemIdList;
};
