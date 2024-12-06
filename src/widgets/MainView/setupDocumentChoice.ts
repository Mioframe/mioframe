import type { DocumentId } from '@automerge/automerge-repo';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import { shallowRef } from 'vue';

export const setupDocumentChoice = () => {
  const selectedReactiveCFRDocument = shallowRef<ReactiveCFRDocument>();
  const onClickFolderDocument = (
    _documentId: DocumentId,
    cfrDocument: ReactiveCFRDocument,
  ) => {
    selectedReactiveCFRDocument.value = cfrDocument;
  };

  return {
    selectedReactiveCFRDocument,
    onClickFolderDocument,
  };
};
