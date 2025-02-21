import { usePickLocalDirectory } from '@feature/localDirectoryPick';
import { useOriginPrivateFSDirectory } from '@feature/originPrivateFileSystemPick';
import type { RefDirectory } from '@shared/lib/refFileSystem';
import { computed, shallowRef } from 'vue';

export const setupDirectoryChoice = () => {
  const selectedDirectory = shallowRef<RefDirectory>();

  const { openOriginPrivateFS } = useOriginPrivateFSDirectory();

  void openOriginPrivateFS().then((v) => {
    selectedDirectory.value = v;
  });

  const { openLocalDirectoryPicker, isSupport: isSupportLocalDirectory } =
    usePickLocalDirectory();

  const onClickSelectDirectory = async () => {
    const localDirectory = await openLocalDirectoryPicker();

    selectedDirectory.value = localDirectory;
  };

  const entries = computed(() => selectedDirectory.value?.entries);

  return {
    selectedDirectory,
    openLocalDirectoryPicker,
    isSupportLocalDirectory,
    onClickSelectDirectory,
    entries,
  };
};
