import type { MaybeRef } from 'vue';
import { computed, toValue, ref } from 'vue';
import {
  createGDriveDirectory,
  type GDriveDirectory,
  type GDriveFile,
} from '../../shared/lib/googleDrive';
import type { UseGDriveDirectory, UseGDriveFile } from './types';
import type { AdvancedGDrive } from '../../shared/lib/googleDrive/getGDrive';
import { useAsyncMap } from '../../shared/ui/TreeMenu/useAsyncMap';

export const useGDriveFile = (
  gDriveFile: MaybeRef<GDriveFile>,
): UseGDriveFile => {
  const label = ref<string>(toValue(gDriveFile).getName());

  const read = () => toValue(gDriveFile).read();
  const remove = () => toValue(gDriveFile).remove();

  const rename = async (newName: string) => {
    await toValue(gDriveFile).rename(newName);
    label.value = toValue(gDriveFile).getName();
    return toValue(gDriveFile);
  };

  const currentEntry: UseGDriveFile = {
    label: computed(() => label.value),
    read,
    remove,
    rename,
  };

  return currentEntry;
};

export const useGDriveDirectory = (
  gDriveDirectory: MaybeRef<GDriveDirectory>,
): UseGDriveDirectory => {
  const { map: stateDirectoryList, fetchMap: updateDirectoryList } =
    useAsyncMap(gDriveDirectory);

  const createDirectory = async (name: string): Promise<GDriveDirectory> => {
    const newGDriveDirectory =
      await toValue(gDriveDirectory).createDirectory(name);

    return newGDriveDirectory;
  };

  const remove = async () => {
    await toValue(gDriveDirectory).remove();
    toValue(gDriveDirectory).removeWatcher(updateDirectoryList);
  };

  const rename = async (newName: string): Promise<GDriveDirectory> => {
    const newLocalDirectory = await toValue(gDriveDirectory).rename(newName);

    return newLocalDirectory;
  };

  const writeFile = async (name: string, file?: File): Promise<GDriveFile> => {
    const localFile = await toValue(gDriveDirectory).writeFile(name, file);

    return localFile;
  };

  const map = computed(
    (): Map<string, GDriveDirectory | GDriveFile> => stateDirectoryList.value,
  );

  const label = computed(() => toValue(gDriveDirectory).getName());

  const currentDirectoryEntry: UseGDriveDirectory = {
    createDirectory,
    get map() {
      if (!map.value.size) {
        void updateDirectoryList();
      }
      return map;
    },
    label,
    remove,
    rename,
    writeFile,
  };

  return currentDirectoryEntry;
};

export const useRootDirectoryEntry = (
  gdrive: AdvancedGDrive,
  gDriveFolderId?: string,
  name?: string,
): UseGDriveDirectory => {
  const roodLocalDirectory = createGDriveDirectory(gdrive, {
    gDriveFolderId,
    name,
  });

  return useGDriveDirectory(roodLocalDirectory);
};
