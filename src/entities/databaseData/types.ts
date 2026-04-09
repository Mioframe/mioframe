import type {
  DatabaseData,
  DatabaseFilter,
  DatabaseItem,
  DatabaseItemId,
  DatabaseSortMap,
  DatabaseUnknownPropertiesMap,
  SORT_DIRECTION,
} from '@shared/lib/databaseDocument';
import type { RecordEntries } from '@shared/lib/objectEntries';
import type { Query } from 'sift';

export type ComparePath = [SORT_DIRECTION] | [SORT_DIRECTION, ...string[]];

export type QueryDataFn = <TSchemaItem extends DatabaseItem = DatabaseItem>(
  data: DatabaseData | RecordEntries<DatabaseData>,
  options: {
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
) => DatabaseItemId[];

export interface SortWorkerApi {
  sortData: (
    data: DatabaseData | RecordEntries<DatabaseData>,
    sorting?: DatabaseSortMap,
    properties?: DatabaseUnknownPropertiesMap,
    firstIndex?: number,
    lastIndex?: number,
  ) => RecordEntries<DatabaseData>;

  partialSort: <T>(
    arr: T[],
    comparePathList?: ComparePath[],
    firstIndex?: number,
    lastIndex?: number,
  ) => T[];

  filter: <TItem, TSchema extends TItem = TItem>(data: TItem[], query: Query<TSchema>) => TItem[];

  queryData: QueryDataFn;
}
