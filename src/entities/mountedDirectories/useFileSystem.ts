import { createGlobalState } from '@vueuse/core';
import { useMainServiceClient } from '@shared/service';
import { computed, toValue } from 'vue';
import { isUndefined } from 'es-toolkit';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { DEVICE_FILES_ROOT_NAME, type DeviceFileDisplayRecord } from '@shared/service/fileSystem';
import { useObservable } from '@shared/lib/useObservable';
import { OPFSName } from '@shared/service/directories';

/** Root directory label used for mounted device-backed Mioframe spaces. */
export const DEVICE_FILES = DEVICE_FILES_ROOT_NAME;

/** UI-facing mounted-directory record enriched with local presentation fields. */
export type MountedDirectoryDisplayRecord = DeviceFileDisplayRecord & {
  description: string;
};

const LOCAL_MIOFRAME_SPACE_DESCRIPTION = 'Mioframe space on this device';
const BROWSER_STORAGE_DESCRIPTION = 'Saved directly in your browser on this device';

/**
 * Maps a raw mounted directory record to the widget-facing display contract.
 * @param record - Mounted directory record returned by the file-system service.
 * @returns Display-ready mounted directory record for the Local FS UI.
 */
const toMountedDirectoryDisplayRecord = (
  record: DeviceFileDisplayRecord,
): MountedDirectoryDisplayRecord => ({
  ...record,
  description:
    record.name === OPFSName ? BROWSER_STORAGE_DESCRIPTION : LOCAL_MIOFRAME_SPACE_DESCRIPTION,
});

const setupFileSystem = () => {
  const {
    fileSystem: {
      createDirectory,
      move,
      remove,
      directoryContent,
      addDeviceDirectory,
      removeDeviceDirectory,
      deviceFiles,
    },
  } = useMainServiceClient();

  const rootPath = '/';

  const {
    data: rootDirectory,
    error,
    isLoading,
  } = useObservableQuery(
    directoryContent,
    computed(() => ({
      path: rootPath,
    })),
  );

  const errorMessage = computed(() => {
    const e = toValue(error);

    if (isUndefined(e)) {
      return undefined;
    }

    if (e instanceof Error) {
      return e.message;
    }

    return 'Error reading directory';
  });

  const { data: activeDeviceFiles } = useObservable(deviceFiles);
  const mountedDirectories = computed(() =>
    activeDeviceFiles.value?.map(toMountedDirectoryDisplayRecord),
  );

  const disconnectDeviceFile = async (
    deviceFile: Pick<DeviceFileDisplayRecord, 'name'> | string,
  ) => {
    await removeDeviceDirectory(typeof deviceFile === 'string' ? deviceFile : deviceFile.name);
  };

  return {
    rootDirectory,
    deviceFiles: mountedDirectories,
    errorMessage,
    isLoading,

    addDeviceDirectory,
    createDirectory,
    disconnectDeviceFile,

    move,
    remove,
    delete: remove,
  };
};

/** Returns the shared mounted-directories facade backed by the main file-system service. */
export const useFileSystem = createGlobalState(setupFileSystem);
