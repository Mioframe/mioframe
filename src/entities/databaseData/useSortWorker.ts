import { wrap } from 'comlink';
import type { SortWorkerApi } from './types';
import { createGlobalState } from '@vueuse/core';
import { loggingDelay } from '@shared/lib/loggingDelay';
import SortWorker from './sortWorker?worker';

export const useSortWorker = createGlobalState(() => {
  const { partialSort, sortData } = wrap<SortWorkerApi>(new SortWorker());

  return {
    partialSort: loggingDelay(partialSort, 'partialSort'),
    sortData: loggingDelay(sortData, 'sortData'),
  };
});
