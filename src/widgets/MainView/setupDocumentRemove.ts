import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { ref } from 'vue';

export const setupDocumentRemove = () => {
  const documentIdForRemove = ref<AMDocumentId>();
  const onClickRemove = (documentId: AMDocumentId) => {
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
