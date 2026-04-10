import { createGlobalState } from '@vueuse/core';
import { useMainServiceClient } from '@shared/service';
import { computed, toValue } from 'vue';
import { isUndefined } from 'es-toolkit';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { DEVICE_FILES_ROOT_NAME, type DeviceFileRecord } from '@shared/service/fileSystem';
import { useObservable } from '@shared/lib/useObservable';

export const DEVICE_FILES = DEVICE_FILES_ROOT_NAME;

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

  const disconnectDeviceFile = async (deviceFile: Pick<DeviceFileRecord, 'name'> | string) => {
    await removeDeviceDirectory(typeof deviceFile === 'string' ? deviceFile : deviceFile.name);
  };

  return {
    rootDirectory,
    deviceFiles: activeDeviceFiles,
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

export const useFileSystem = createGlobalState(setupFileSystem);
