import type { CFRDocumentContent, RepoRef } from '@shared/lib/cfrDocument';
import { type MaybeRef } from '@vueuse/core';
import { computed, ref, toValue } from 'vue';

export const setupDocumentCreate = (
  documentFolder: MaybeRef<RepoRef | undefined>,
) => {
  const showForm = ref(false);
  const isDisplayedDocumentCreationForm = computed({
    get: () => showForm.value && !!toValue(documentFolder),
    set: (show: boolean) => (showForm.value = show),
  });
  const onClickCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = true;
  };
  const onCancelCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = false;
  };
  const onCreateDocument = (documentContent: CFRDocumentContent) => {
    const folder = toValue(documentFolder);
    if (folder) {
      folder.create(documentContent);
      isDisplayedDocumentCreationForm.value = false;
    }
  };

  return {
    isDisplayedDocumentCreationForm,
    onClickCreateDocument,
    onCancelCreateDocument,
    onCreateDocument,
  };
};
