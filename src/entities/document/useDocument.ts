import type { DeepReadonly } from 'vue';
import { type Ref, ref, watch, readonly } from 'vue';
import type { DocumentApi, CRDocument } from '../../shared/lib/documentApi';
import { tryOnScopeDispose } from '@vueuse/core';
import { createLogModule } from '../../shared/lib/logger';
import { replaceObject } from '../../shared/lib/changeObject';
import type { ReadonlyDeep } from 'type-fest';

const { debug } = createLogModule('useDocument');

type RefDocument<T extends CRDocument = CRDocument> = {
  doc: Readonly<Ref<DeepReadonly<T> | undefined, DeepReadonly<T> | undefined>>;
  cahnge: (
    callback: (doc: { name: string; type: string; body?: unknown }) => void,
  ) => void;
};

export const useDocument = <T extends CRDocument>(
  documentApi: Ref<DocumentApi<T> | undefined>,
): RefDocument => {
  const docState = ref<T>();

  const handlerChange = ({ doc: newDoc }: { doc: ReadonlyDeep<T> | T }) => {
    debug('handlerChange', newDoc);
    if (documentApi.value) {
      if (!docState.value) {
        docState.value = {} as T;
      }
      replaceObject(docState.value, newDoc);
    }
    debug('handlerChange end', docState.value, newDoc);
  };

  watch(
    documentApi,
    async (documentApi, old) => {
      debug('watch documentApi', documentApi, old);
      if (old) {
        old.off('change', handlerChange);
      }

      if (documentApi) {
        documentApi.on('change', handlerChange);
        const newDoc = await documentApi.doc();
        if (newDoc) {
          handlerChange({ doc: newDoc });
        }
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
