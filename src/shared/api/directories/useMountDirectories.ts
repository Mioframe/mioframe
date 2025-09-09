import { useReactiveMapStore } from '@shared/lib/remoteStore';
import { type StrictRecord } from '@shared/lib/strictRecord';
import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';

export const useMountDirectories = createGlobalState(() => {
  const { data: mountedStorage } = useIDBKeyval<
    StrictRecord<string, FileSystemDirectoryHandle>
  >('mountedStorage', {});

  const store = useReactiveMapStore(mountedStorage);

  return { ...store };
});
