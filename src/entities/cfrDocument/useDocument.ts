import type { AMDocumentId } from '@shared/lib/automerge';
import { useMainService } from '@shared/service';
import { computedAsync } from '@vueuse/core';
import type { Ref } from 'vue';

export const useDocument = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    documents: { put, patch, getDocumentDescription },
  } = useMainService();

  const documentDescription = computedAsync(
    async () => await getDocumentDescription(path.value, documentId.value),
    undefined,
    { lazy: true },
  );

  return {
    put,
    patch,
    documentDescription,
  };
};
