import type { DocumentId } from '@automerge/automerge-repo';
import type { CFRDocument } from '@shared/lib/cfrDocument';
import type { Ref } from 'vue';
import { shallowRef } from 'vue';

export const setupDocumentChoice = (isOpenPanel: Ref<boolean>) => {
  const selectedCFRDocument = shallowRef<CFRDocument>();
  const onClickFolderDocument = (
    _documentId: DocumentId,
    cfrDocument: CFRDocument,
  ) => {
    selectedCFRDocument.value = cfrDocument;
    isOpenPanel.value = false;
  };

  return { selectedCFRDocument, onClickFolderDocument };
};
