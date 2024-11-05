import type { DocumentFolder } from '@shared/lib/cfrDocument';
import { createDocumentFolder } from '@shared/lib/cfrDocument';
import type { GDriveDirectory } from '@shared/lib/googleDrive';
import type { ShallowRef } from 'vue';
import { ref } from 'vue';

export const setupGoogleDirectoryChoice = (
  selectedDocumentFolder: ShallowRef<DocumentFolder | undefined>,
) => {
  const openSelectGDirectory = ref(false);
  const onClickSelectGDirectory = () => {
    openSelectGDirectory.value = true;
  };
  const onSelectGDirectory = (directory: GDriveDirectory) => {
    selectedDocumentFolder.value = createDocumentFolder(directory);
    openSelectGDirectory.value = false;
  };
  const onCancelSelectGDirectory = () => {
    openSelectGDirectory.value = false;
  };

  return {
    openSelectGDirectory,
    onClickSelectGDirectory,
    onSelectGDirectory,
    onCancelSelectGDirectory,
  };
};
