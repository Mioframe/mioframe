import { useDocumentFolder } from '@entity/folder/useDocumentFolder';
import { usePickLocalDirectory } from '@feature/localDirectoryPick';
import type { DocumentFolder } from '@shared/lib/cfrDocument';
import { createDocumentFolder } from '@shared/lib/cfrDocument';
import { shallowRef } from 'vue';

export const setupFolderChoice = () => {
  const selectedDocumentFolder = shallowRef<DocumentFolder>();
  const { openLocalDirectoryPicker, isSupport: isSupportLocalDirectory } =
    usePickLocalDirectory();
  const onClickSelectDirectory = async () => {
    const localDirectory = await openLocalDirectoryPicker();

    selectedDocumentFolder.value = createDocumentFolder(localDirectory);
  };
  const { content: folderContents } = useDocumentFolder(selectedDocumentFolder);

  return {
    selectedDocumentFolder,
    openLocalDirectoryPicker,
    isSupportLocalDirectory,
    onClickSelectDirectory,
    folderContents,
  };
};
