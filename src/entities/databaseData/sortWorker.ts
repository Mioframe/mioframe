import { expose } from 'comlink';
import { type ComparePath, type SortWorkerApi } from './types';
import type { RecordEntries } from '@shared/lib/objectEntries';
import { recordEntries } from '@shared/lib/objectEntries';
import { partialSort } from './partialSort';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabaseSortMap,
} from '@shared/lib/databaseDocument';
import { type DatabaseData } from '@shared/lib/databaseDocument';
import type { Query } from 'sift';
import sift from 'sift';
import { isArray } from 'es-toolkit/compat';

const sortData = (
  data: DatabaseData | RecordEntries<DatabaseData>,
  sorting?: DatabaseSortMap,
  firstIndex?: number,
  lastIndex?: number,
): RecordEntries<DatabaseData> => {
  const entries = isArray(data) ? data : recordEntries(data);

  const comparePathList: ComparePath[] | undefined = sorting
    ? recordEntries(sorting)
        .sort(([, { priority: a }], [, { priority: b }]) => a - b)
        .map(([id, { direction }]) => [direction, '1', id])
    : undefined;

  const sortResult = partialSort(
    entries,
    comparePathList,
    firstIndex ?? 0,
    lastIndex ?? entries.length - 1,
  );

  return sortResult;
};

const filter = <TItem, TSchema extends TItem = TItem>(
  data: TItem[],
  query: Query<TSchema>,
): TItem[] => data.filter(sift(query));

const queryData = <TSchemaItem extends DatabaseItem = DatabaseItem>(
  data: DatabaseData | RecordEntries<DatabaseData>,
  {
    idQuery,
    itemQuery,
    slice: { first, last } = {},
    sorting,
  }: {
    itemQuery?: Query<TSchemaItem>;
    idQuery?: Query<DatabaseItemId>;
    sorting?: DatabaseSortMap;
    slice?: {
      first?: number;
      last?: number;
    };
  },
): DatabaseItemId[] => {
  const entries = isArray(data) ? data : recordEntries(data);

  const filteredEntries =
    itemQuery || idQuery
      ? entries.filter(
          ([id, item]) =>
            (idQuery ? sift(idQuery)(id) : true) &&
            (itemQuery ? sift(itemQuery)(item) : true),
        )
      : entries;

  const sortedEntries = sortData(filteredEntries, sorting, first, last);

  const itemIdList = sortedEntries.map(([id]) => id);

  return itemIdList;
};

const sortWorkerApi: SortWorkerApi = {
  sortData,
  partialSort,
  filter,
  queryData,
};

expose(sortWorkerApi);
