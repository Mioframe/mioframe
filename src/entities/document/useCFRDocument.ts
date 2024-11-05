import type { DeepReadonly } from 'vue';
import { type Ref, ref, watch, readonly } from 'vue';
import type {
  CFRDocument,
  DocumentContent,
} from '../../shared/lib/cfrDocument';
import { tryOnScopeDispose } from '@vueuse/core';
import { createLogger } from '../../shared/lib/logger';
import { replaceObject } from '../../shared/lib/changeObject';
import type { ReadonlyDeep } from 'type-fest';
import { cloneDeep } from 'lodash-es';

const { debug } = createLogger('useDocument');

type RefCFRDocument<T extends DocumentContent = DocumentContent> = {
  doc: Readonly<Ref<DeepReadonly<T> | undefined, DeepReadonly<T> | undefined>>;
  change: (
    callback: (doc: { name: string; type: string; body?: unknown }) => void,
  ) => void;
};

export const useCFRDocument = <T extends DocumentContent>(
  cfrDocument: Ref<CFRDocument<T> | undefined>,
): RefCFRDocument => {
  const docState = ref<T>();

  const handlerChange = ({ doc: newDoc }: { doc: ReadonlyDeep<T> | T }) => {
    debug('handlerChange', newDoc);
    if (cfrDocument.value) {
      if (!docState.value) {
        docState.value = {} as T;
      }
      replaceObject(docState.value, newDoc);
    }
    debug('handlerChange end', docState.value, newDoc);
  };

  watch(
    cfrDocument,
    async (cfrDocument, old) => {
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
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    cfrDocument.value?.off('change', handlerChange);
  });

  return {
    doc: readonly(docState),
    change: (...args: Parameters<CFRDocument['change']>) =>
      cfrDocument.value?.change(...args),
  };
};
