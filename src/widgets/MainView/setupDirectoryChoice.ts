import { usePickLocalDirectory } from '@feature/localDirectoryPick';
import { useOriginPrivateFSDirectory } from '@feature/originPrivateFileSystemPick';
import { createLogger } from '@shared/lib/logger';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { shallowRef } from 'vue';

const { debug } = createLogger('setupDirectoryChoice');

export const setupDirectoryChoice = () => {
  const selectedDirectory = shallowRef<DirectoryFSEntry>();

  const { openOriginPrivateFS } = useOriginPrivateFSDirectory();

  void openOriginPrivateFS().then((v) => {
    debug('openOriginPrivateFS');
    selectedDirectory.value = v;
  });

  const { openLocalDirectoryPicker, isSupport: isSupportLocalDirectory } =
    usePickLocalDirectory();

  const onClickSelectDirectory = async () => {
    const localDirectory = await openLocalDirectoryPicker();

    selectedDirectory.value = localDirectory;
  };

  return {
    selectedDirectory,
    openLocalDirectoryPicker,
    isSupportLocalDirectory,
    onClickSelectDirectory,
  };
};
