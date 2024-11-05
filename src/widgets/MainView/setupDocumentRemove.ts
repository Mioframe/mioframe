import type { DocumentId } from '@automerge/automerge-repo';
import { ref } from 'vue';

export const setupDocumentRemove = () => {
  const documentIdForRemove = ref<DocumentId>();
  const onClickRemove = (documentId: DocumentId) => {
    documentIdForRemove.value = documentId;
  };
  const onCancelRemove = () => {
    documentIdForRemove.value = undefined;
  };
  const onRemoved = onCancelRemove;

  return {
    documentIdForRemove,
    onClickRemove,
    onCancelRemove,
    onRemoved,
  };
};
