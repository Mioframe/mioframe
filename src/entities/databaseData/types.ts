import type {
  DatabaseData,
  DatabaseItemId,
  DatabaseSortMap,
  SORT_DIRECTION,
} from '@shared/lib/databaseDocument';

export type ComparePath = [SORT_DIRECTION] | [SORT_DIRECTION, ...string[]];

export interface SortWorkerApi {
  sortData: (
    data: DatabaseData,
    sorting?: DatabaseSortMap,
    firstIndex?: number,
    lastIndex?: number,
  ) => DatabaseItemId[];

  partialSort: <T>(
    arr: T[],
    comparePathList?: ComparePath[],
    firstIndex?: number,
    lastIndex?: number,
  ) => T[];
}
