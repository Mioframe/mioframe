import { useDocumentFolder } from '@entity/folder/useDocumentFolder';
import { usePickLocalDirectory } from '@feature/localDirectoryPick';
import type { DocumentFolder } from '@shared/lib/cfrDocument';
import { createDocumentFolder } from '@shared/lib/cfrDocument';
import type { Ref } from 'vue';
import { computed, shallowRef, watch } from 'vue';

export const setupFolderChoice = (isOpenPanel: Ref<boolean>) => {
  const selectedDocumentFolder = shallowRef<DocumentFolder>();
  const { openLocalDirectoryPicker, isSupport: isSupportLocalDirectory } =
    usePickLocalDirectory();
  const onClickSelectDirectory = async () => {
    const localDirectory = await openLocalDirectoryPicker();

    selectedDocumentFolder.value = createDocumentFolder(localDirectory);
  };
  const { content: contentFolderMap } = useDocumentFolder(
    selectedDocumentFolder,
  );
  const contentFolderSize = computed(() => contentFolderMap.value.size);
  watch(contentFolderSize, (contentFolderSize) => {
    setTimeout(() => {
      isOpenPanel.value = Boolean(contentFolderSize);
    }, 100);
  });

  return {
    selectedDocumentFolder,
    openLocalDirectoryPicker,
    isSupportLocalDirectory,
    onClickSelectDirectory,
    contentFolderMap,
    contentFolderSize,
  };
};
