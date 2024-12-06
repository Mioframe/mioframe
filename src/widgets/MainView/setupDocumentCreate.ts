import { ref } from 'vue';

export const setupDocumentCreate = () => {
  const isDisplayedDocumentCreationForm = ref(false);
  const onClickCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = true;
  };
  const onCancelCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = false;
  };
  const onCreatedDocument = onCancelCreateDocument;

  return {
    isDisplayedDocumentCreationForm,
    onClickCreateDocument,
    onCancelCreateDocument,
    onCreatedDocument,
  };
};
