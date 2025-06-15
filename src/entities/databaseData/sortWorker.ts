import { expose } from 'comlink';
import { type ComparePath, type SortWorkerApi } from './types';
import { recordEntries } from '@shared/lib/objectEntries';
import { partialSort } from './partialSort';
import type {
  DatabaseItemId,
  DatabaseSortMap,
} from '@shared/lib/databaseDocument';
import { type DatabaseData } from '@shared/lib/databaseDocument';

const sortData = (
  data: DatabaseData,
  sorting?: DatabaseSortMap,
  firstIndex?: number,
  lastIndex?: number,
): DatabaseItemId[] => {
  const entries = recordEntries(data);

  // todo: фильтрация до сортировки

  const comparePathList: ComparePath[] | undefined = sorting
    ? recordEntries(sorting)
        .sort(([, { priority: a }], [, { priority: b }]) => a - b)
        .map(([id, { direction }]) => [direction, id])
    : undefined;

  return partialSort(
    entries,
    comparePathList,
    firstIndex ?? 0,
    lastIndex ?? entries.length - 1,
  ).map(([id]) => id);
};

const sortWorkerApi: SortWorkerApi = {
  sortData,
  partialSort,
};

expose(sortWorkerApi);
