import type { ComputedRef, DeepReadonly, Reactive } from 'vue';
import {
  type Ref,
  ref,
  watch,
  readonly,
  reactive,
  isRef,
  toValue,
  computed,
} from 'vue';
import type { UseCFRDocument, DocumentContent } from '@shared/lib/cfrDocument';
import type { MaybeRef } from '@vueuse/core';
import { tryOnScopeDispose } from '@vueuse/core';
import { createLogger } from '@shared/lib/logger';
import { replaceObject } from '@shared/lib/changeObject';
import { cloneDeep, throttle } from 'lodash-es';

const { debug } = createLogger('reactiveCFRDocument');

type ReadCFRDocument = {
  name: ComputedRef<string>;
  doc: Ref<DeepReadonly<DocumentContent> | undefined>;
  change: (
    callback: (doc: DocumentContent) => unknown,
  ) => (() => Promise<DocumentContent | undefined>) | undefined;
};

export type ReactiveCFRDocument = Reactive<ReadCFRDocument>;

/**
 * Реактивное чтение CFRDocument
 * @param cfrDocument
 * @returns
 */
export const reactiveCFRDocument = <CFRDoc extends UseCFRDocument>(
  cfrDocument: MaybeRef<CFRDoc | undefined>,
): ReactiveCFRDocument => {
  const documentState = ref<DocumentContent>();

  const updateRefDoc = throttle(
    ({ doc: newDoc }: { doc?: DocumentContent }) => {
      debug('updateRefDoc', newDoc);
      if (newDoc && !documentState.value) {
        documentState.value = cloneDeep(newDoc);
      } else if (newDoc && documentState.value) {
        replaceObject(documentState.value, newDoc);
      } else {
        documentState.value = undefined;
      }
      debug('updateRefDoc end', documentState.value, newDoc);
    },
    1e3 / 10,
  );

  const onChangeCFRDocument = async (
    cfrDocument: CFRDoc | undefined,
    oldCfrDocument?: CFRDoc,
  ) => {
    debug('watch cfrDocument', cfrDocument, oldCfrDocument);
    oldCfrDocument?.off('change', updateRefDoc);

    if (cfrDocument) {
      cfrDocument.on('change', updateRefDoc);
      const newDoc = await cfrDocument.readDoc();
      debug('watch cfrDocument newDoc', cloneDeep(newDoc));
      if (newDoc) {
        updateRefDoc({ doc: newDoc });
      }
    }
  };

  if (isRef(cfrDocument)) {
    watch(cfrDocument, onChangeCFRDocument, { immediate: true });
  } else {
    void onChangeCFRDocument(cfrDocument);
  }
  debug('initial cfrDocument', cfrDocument);

  tryOnScopeDispose(() => {
    toValue(cfrDocument)?.off('change', updateRefDoc);
  });

  const documentName = computed(() => documentState.value?.name ?? 'nameless');

  return reactive<ReadCFRDocument>({
    name: documentName,
    doc: readonly(documentState),
    change: (
      callback: (doc: DocumentContent) => unknown,
    ): (() => Promise<DocumentContent | undefined>) | undefined => {
      const doc = toValue(cfrDocument);
      if (doc) {
        doc.change(callback);

        return async (): Promise<DocumentContent | undefined> => {
          updateRefDoc({ doc: await doc.readDoc() });
          return documentState.value;
        };
      }
    },
  });
};
