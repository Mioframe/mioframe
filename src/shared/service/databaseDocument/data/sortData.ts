import type {
  DatabaseData,
  DatabaseSortMap,
} from '@shared/lib/databaseDocument';
import type { RecordEntries } from '@shared/lib/objectEntries';
import { recordEntries } from '@shared/lib/objectEntries';
import { isArray } from 'es-toolkit/compat';
import type { ComparePath } from '../../../../entities/databaseData/types';
import { partialSort } from './partialSort';

export const sortData = (
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
