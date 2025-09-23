import { useApiClient } from '@shared/api';
import { useSubscribeByQueryClient } from '@shared/lib/remoteStore';
import { createGlobalState } from '@vueuse/core';

export const useCFRDocumentClient = createGlobalState(() => {
  const api = useApiClient();

  const documentDescription = useSubscribeByQueryClient(
    api.cfrDocument.subscribeDocumentDescription,
  );

  const put = (...args: Parameters<typeof api.cfrDocument.put>) =>
    api.cfrDocument.put(...args);

  const patch = (...args: Parameters<typeof api.cfrDocument.patch>) =>
    api.cfrDocument.patch(...args);

  return {
    documentDescription,

    put,
    patch,
  };
});
