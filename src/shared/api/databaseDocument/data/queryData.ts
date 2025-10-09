import type {
  DatabaseData,
  DatabaseFilter,
  DatabaseItem,
  DatabaseItemId,
  DatabaseSortMap,
} from '@shared/lib/databaseDocument';
import type { RecordEntries } from '@shared/lib/objectEntries';
import { recordEntries } from '@shared/lib/objectEntries';
import { isArray } from 'es-toolkit/compat';
import type { Query } from 'sift';
import sift from 'sift';
import { sortData } from './sortData';

export const queryIdList = <TSchemaItem extends DatabaseItem = DatabaseItem>(
  data: DatabaseData | RecordEntries<DatabaseData>,
  {
    idQuery,
    itemQuery,
    slice: { first, last } = {},
    sorting,
    filter,
  }: {
    itemQuery?: Query<TSchemaItem>;
    idQuery?: Query<DatabaseItemId>;
    sorting?: DatabaseSortMap;
    filter?: DatabaseFilter;
    slice?: {
      first?: number;
      last?: number;
    };
  },
): DatabaseItemId[] => {
  const entries = isArray(data) ? data : recordEntries(data);

  const filteredEntries =
    itemQuery || idQuery || filter
      ? entries.filter(
          ([id, item]) =>
            (idQuery ? sift(idQuery)(id) : true) &&
            (itemQuery ? sift(itemQuery)(item) : true) &&
            (filter ? sift(filter)(item) : true),
        )
      : entries;

  const sortedEntries = sortData(filteredEntries, sorting, first, last);

  const itemIdList = sortedEntries.map(([id]) => id);

  return itemIdList;
};
