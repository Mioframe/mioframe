import type { DeepReadonly } from 'vue';
import { type Ref, ref, watch, readonly, computed } from 'vue';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any keys
const cachedRefs = new WeakMap<DocumentApi<any>, Ref<CRDocument | undefined>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any keys
const getCashedRefs = (documentApi: DocumentApi<any>) => {
  const cashedRef = cachedRefs.get(documentApi);
  if (!cashedRef) {
    const freshCashedRef = ref<CRDocument>();
    cachedRefs.set(documentApi, freshCashedRef);
    return freshCashedRef;
  }
  return cashedRef;
};

export const useDocument = <T extends CRDocument>(
  documentApi: Ref<DocumentApi<T> | undefined>,
): RefDocument => {
  // const docState = ref<T>();

  const handlerChange = ({ doc: newDoc }: { doc: ReadonlyDeep<T> | T }) => {
    debug('handlerChange', newDoc);
    if (documentApi.value) {
      const docState = getCashedRefs(documentApi.value);

      if (!docState.value) {
        docState.value = {} as T;
      }
      replaceObject(docState.value, newDoc);
      debug('handlerChange end', docState.value, newDoc);
    }
  };

  watch(
    documentApi,
    async (documentApi, old) => {
      debug('watch documentApi', documentApi, old); // todo: не регестрировать обработчики если они уже регестрировались для cacheRef
      old?.off('change', handlerChange);
      documentApi?.on('change', handlerChange);

      if (documentApi) {
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

  const doc = computed((): T | undefined => {
    if (documentApi.value) {
      const cachedRef = getCashedRefs(documentApi.value);
      return cachedRef.value as T | undefined;
    }

    return undefined;
  });

  return {
    doc: readonly(doc),
    cahnge: (...args: Parameters<DocumentApi['change']>) =>
      documentApi.value?.change(...args),
  };
};
