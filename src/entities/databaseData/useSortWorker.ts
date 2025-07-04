import { wrap } from 'comlink';
import type { SortWorkerApi } from './types';
import { createGlobalState } from '@vueuse/core';
import SortWorker from './sortWorker?worker';

export const useSortWorker = createGlobalState(() => {
  const { partialSort, sortData, queryData, filter } = wrap<SortWorkerApi>(
    new SortWorker(),
  );

  return {
    partialSort,
    sortData,
    filter,
    queryData,
  };
});
