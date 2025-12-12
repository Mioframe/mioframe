import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { useMainService } from '@shared/service';
import { asyncComputed } from '@vueuse/core';
import { shallowRef, type Ref } from 'vue';

export const useRepository = (path: Ref<string>) => {
  const {
    repositories: { readRepository, createDocument, deleteDocument },
  } = useMainService();

  const evaluating = shallowRef(false);
  const error = shallowRef<unknown>();

  const documentList = asyncComputed(
    () => readRepository(path.value),
    undefined,
    {
      lazy: true,
      evaluating,
      onError: (e) => {
        error.value = e;
      },
    },
  );

  return {
    documentList,
    createDocument: (initialValue: CFRDocumentContent) =>
      createDocument(path.value, initialValue),
    deleteDocument: (id: AMDocumentId) => deleteDocument(path.value, id),
  };
};
