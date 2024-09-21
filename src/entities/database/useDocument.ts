import { type Ref, ref, watch, readonly } from 'vue';
import type { DocumentApi, CRDocument } from '../../shared/lib/documentApi';
import { tryOnScopeDispose } from '@vueuse/core';
import { createLogModule } from '../../shared/lib/logger';
import { replaceObject } from '../../shared/lib/changeObject';

const { debug } = createLogModule('useDocument');

export const useDocument = (documentApi: Ref<DocumentApi | undefined>) => {
  const docState = ref<CRDocument>();

  const handlerChange = ({ doc: newDoc }: { doc: CRDocument }) => {
    if (docState.value) {
      replaceObject(docState.value, newDoc);
    } else {
      docState.value = newDoc;
    }
  };

  watch(
    documentApi,
    async (documentApi, old) => {
      debug('watch documentApi', documentApi, old);
      old?.off('change', handlerChange);
      documentApi?.on('change', handlerChange);

      if (documentApi) {
        docState.value = await documentApi.doc();
      } else {
        docState.value = undefined;
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    documentApi.value?.off('change', handlerChange);
  });

  return {
    doc: readonly(docState),
    cahnge: (...args: Parameters<DocumentApi['change']>) =>
      documentApi.value?.change(...args),
  };
};
