import { expose } from 'comlink';
import {
  type ComparePath,
  type DatabaseData,
  type SortWorkerApi,
  type Sorting,
  SORT_DIRECTION,
} from './types';
import { objectEntries } from '@shared/lib/objectEntries';
import { partialSort } from './partialSort';

const sortData = (
  data: DatabaseData,
  sorting?: Sorting,
  firstIndex?: number,
  lastIndex?: number,
) => {
  const entries = objectEntries(data);

  // todo: фильтрация до сортировки

  const comparePathList: ComparePath[] | undefined = sorting
    ? Object.entries(sorting)
        .sort(([, { priority: a }], [, { priority: b }]) => a - b)
        .map(([id, { direction }]) => [
          direction === SORT_DIRECTION.descending,
          id,
        ])
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
