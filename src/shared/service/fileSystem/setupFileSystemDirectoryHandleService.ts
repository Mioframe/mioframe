import { ObservableIDB } from '@shared/lib/observableIDB';
import { createGlobalState } from '@vueuse/core';
import { distinctUntilChanged, filter, firstValueFrom, map, type Observable } from 'rxjs';
import { isEqual } from 'es-toolkit';
import { array, catch as zCatch, custom, object, optional, string } from 'zod/v4-mini';
import type { DeviceFileRecord } from '@shared/lib/deviceFileSystemProvider';
import { isFileSystemDirectoryHandle } from '@shared/lib/typeGuards';

export type PersistedDeviceDirectoryRecord = Pick<
  DeviceFileRecord,
  'description' | 'handle' | 'name'
>;

const KEY = 'device-directory-handles';

const zodDeviceDirectoryRecord = object({
  description: optional(string()),
  name: string(),
  handle: custom<FileSystemDirectoryHandle>((value) => isFileSystemDirectoryHandle(value)),
});

const zodDeviceDirectoryRecordList = zCatch(array(zodDeviceDirectoryRecord), []);

const normalizePersistedRecord = ({
  description,
  handle,
  name,
}: {
  description?: string | undefined;
  handle: FileSystemDirectoryHandle;
  name: string;
}): PersistedDeviceDirectoryRecord => ({
  name,
  handle,
  ...(description === undefined ? {} : { description }),
});

const setupFileSystemDirectoryHandleService = () => {
  const store = new ObservableIDB(KEY, zodDeviceDirectoryRecordList);

  const $recordList: Observable<PersistedDeviceDirectoryRecord[]> = store.observable().pipe(
    filter((value): value is Exclude<typeof value, null> => value !== null),
    map((value) => (value.success ? value.data.map(normalizePersistedRecord) : [])),
    distinctUntilChanged((a, b) => isEqual(a, b)),
  );

  const getRecordList = (): Promise<PersistedDeviceDirectoryRecord[]> =>
    firstValueFrom($recordList);

  const updateRecordList = async (records: PersistedDeviceDirectoryRecord[]) => {
    await store.set(records);
  };

  return {
    $recordList,
    getRecordList,
    updateRecordList,
  };
};

export const useFileSystemDirectoryHandleService = createGlobalState(
  setupFileSystemDirectoryHandleService,
);
