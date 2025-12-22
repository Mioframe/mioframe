import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { useLiveResource } from '@shared/lib/useLiveResource';
import { useMainService } from '@shared/service';
import { type Ref } from 'vue';

export const useRepository = (path: Ref<string>) => {
  const {
    repositories: {
      readRepository,
      createDocument,
      deleteDocument,
      onChangeRepository: onChange,
    },
  } = useMainService();

  const { errorMessage, isLoading, isReady, state } = useLiveResource(path, {
    fetch: (path) => readRepository(path),
    subscribe: (path, cb) => onChange(path, cb),
    defaultErrorMessage: 'Error reading repository',
  });

  return {
    state,
    errorMessage,
    isLoading,
    isReady,

    createDocument: (initialValue: CFRDocumentContent) =>
      createDocument(path.value, initialValue),
    deleteDocument: (id: AMDocumentId) => deleteDocument(path.value, id),
  };
};
