import type { Ref } from 'vue';
import { ref } from 'vue';

export const setupDocumentCreate = (isOpenPanel: Ref<boolean>) => {
  const isDisplayedDocumentCreationForm = ref(false);
  const onClickCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = true;
  };
  const onCancelCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = false;
    isOpenPanel.value = true;
  };
  const onCreatedDocument = onCancelCreateDocument;

  return {
    isDisplayedDocumentCreationForm,
    onClickCreateDocument,
    onCancelCreateDocument,
    onCreatedDocument,
  };
};
