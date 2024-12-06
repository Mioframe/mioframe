import type { DeepReadonly, Reactive } from 'vue';
import { type Ref, ref, watch, readonly, reactive, isRef } from 'vue';
import type {
  CFRDocument,
  DocumentContent,
} from '../../shared/lib/cfrDocument';
import type { MaybeRef } from '@vueuse/core';
import { toValue, tryOnScopeDispose } from '@vueuse/core';
import { createLogger } from '../../shared/lib/logger';
import { replaceObject } from '../../shared/lib/changeObject';
import type { ReadonlyDeep } from 'type-fest';
import { cloneDeep } from 'lodash-es';

const { debug } = createLogger('createReactiveCFRDocument');

type ReadCFRDocument<T extends DocumentContent = DocumentContent> = {
  doc: Ref<DeepReadonly<T | undefined>>;
  change: (
    callback: (doc: { name: string; type: string; body?: unknown }) => void,
  ) => (() => ReturnType<CFRDocument<T>['doc']>) | undefined;
};

export type ReactiveCFRDocument<T extends DocumentContent = DocumentContent> =
  Reactive<ReadCFRDocument<T>>;

export const createReactiveCFRDocument = <T extends DocumentContent>(
  cfrDocument: MaybeRef<CFRDocument<T> | undefined>,
): ReactiveCFRDocument<T> => {
  const docState = ref<T>();

  const handlerChange = ({ doc: newDoc }: { doc: ReadonlyDeep<T> | T }) => {
    debug('handlerChange', newDoc);
    const doc = toValue(cfrDocument);
    if (doc) {
      if (!docState.value) {
        docState.value = {} as T;
      }
      replaceObject(docState.value, newDoc);
    }
    debug('handlerChange end', docState.value, newDoc);
  };

  const onChangeCFRDocument = async (
    cfrDocument: CFRDocument<T> | undefined,
    old?: CFRDocument<T>,
  ) => {
    debug('watch cfrDocument', cfrDocument, old);
    if (old) {
      old.off('change', handlerChange);
    }

    if (cfrDocument) {
      cfrDocument.on('change', handlerChange);
      const newDoc = await cfrDocument.doc();
      debug('watch cfrDocument newDoc', cloneDeep(newDoc));
      if (newDoc) {
        handlerChange({ doc: newDoc });
      }
    }
  };

  if (isRef(cfrDocument)) {
    watch(cfrDocument, onChangeCFRDocument, { immediate: true });
  } else {
    void onChangeCFRDocument(cfrDocument);
  }

  tryOnScopeDispose(() => {
    toValue(cfrDocument)?.off('change', handlerChange);
  });

  return reactive({
    doc: readonly(docState),
    change: (
      ...args: Parameters<CFRDocument['change']>
    ): (() => ReturnType<CFRDocument<T>['doc']>) | undefined => {
      const doc = toValue(cfrDocument);
      if (doc) {
        doc.change(...args);

        return async (): ReturnType<CFRDocument<T>['doc']> => {
          return await doc.doc();
        };
      }
    },
  });
};
