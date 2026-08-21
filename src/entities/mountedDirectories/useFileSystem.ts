import { createGlobalState } from '@vueuse/core';
import { useMainServiceClient } from '@shared/service';
import { computed } from 'vue';
import {
  DEVICE_FILES_ROOT_NAME,
  type DeviceFileDisplayRecord,
  type MioframeSpaceInspection,
  type ReconnectDeviceDirectoryResult,
  type RelocateRememberedDeviceDirectoryResult,
} from '@shared/service';
import { useObservable } from '@shared/lib/useObservable';
import { OPFSName } from '@shared/service';

/** Root directory label used for mounted device-backed Mioframe spaces. */
export const DEVICE_FILES = DEVICE_FILES_ROOT_NAME;

/** UI-facing mounted-directory record enriched with local presentation fields. */
export type MountedDirectoryDisplayRecord = DeviceFileDisplayRecord & {
  description: string;
};

const LOCAL_MIOFRAME_SPACE_DESCRIPTION = 'Mioframe space on this device';
const BROWSER_STORAGE_DESCRIPTION = 'Stored in this browser';

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
      addDeviceDirectory,
      removeDeviceDirectory,
      reconnectDeviceDirectory,
      relocateRememberedDeviceDirectory,
      inspectMioframeSpaceCandidate,
      deviceFiles,
    },
  } = useMainServiceClient();

  const { data: activeDeviceFiles } = useObservable(deviceFiles);
  const mountedDirectories = computed(() =>
    activeDeviceFiles.value?.map(toMountedDirectoryDisplayRecord),
  );

  const disconnectDeviceFile = async (
    deviceFile: Pick<DeviceFileDisplayRecord, 'name'> | string,
  ) => {
    await removeDeviceDirectory(typeof deviceFile === 'string' ? deviceFile : deviceFile.name);
  };

  const reconnectDirectory = (params: {
    handle: FileSystemDirectoryHandle;
    spaceName: string;
    recoveryKey: string;
  }): Promise<ReconnectDeviceDirectoryResult> => reconnectDeviceDirectory(params);

  const relocateRememberedDirectory = (params: {
    handle: FileSystemDirectoryHandle;
    spaceName: string;
    recoveryKey: string;
  }): Promise<RelocateRememberedDeviceDirectoryResult> => relocateRememberedDeviceDirectory(params);

  const inspectMioframeSpaceCandidateEntry = (
    handle: FileSystemDirectoryHandle,
  ): Promise<MioframeSpaceInspection> => inspectMioframeSpaceCandidate(handle);

  return {
    deviceFiles: mountedDirectories,

    addDeviceDirectory,
    createDirectory,
    disconnectDeviceFile,
    reconnectDirectory,
    relocateRememberedDirectory,
    inspectMioframeSpaceCandidate: inspectMioframeSpaceCandidateEntry,

    move,
    remove,
    delete: remove,
  };
};

/** Returns the shared mounted-directories facade backed by the main file-system service. */
export const useFileSystem = createGlobalState(setupFileSystem);
