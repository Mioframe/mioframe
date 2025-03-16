import { cloneDeep, isObject, uniqueId } from 'lodash-es';
import { createLogger } from '../logger';
import { checkSchema } from '../validateZodScheme';
import type { UseCFRDocument } from './types';
import { zodDocumentContent, type DocumentContent } from './types';
import type { ChangeFn, DocHandle } from '@automerge/automerge-repo';
import { applyCFRDocumentMigration } from './migrations';
import type { MaybeRefOrGetter } from 'vue';
import { computed, ref, toRef, toValue, watch } from 'vue';
import { replaceObject } from '../changeObject';
import { tryOnScopeDispose } from '@vueuse/core';

const { debug } = createLogger('useCFRDocument');

const defaultDocumentContent = (): DocumentContent => ({
  name: 'unknown',
  type: 'unknown',
});

export const useCFRDocument = (
  docHandle: MaybeRefOrGetter<DocHandle<unknown> | undefined>,
): UseCFRDocument => {
  const debugId = uniqueId('useCFRDocument');

  const docHandleRef = toRef(() => toValue(docHandle));

  debug('start', debugId);

  const contentState = ref<DocumentContent>(defaultDocumentContent());

  const readDoc = async () => {
    debug('readDoc', debugId);
    const stateDocHandler = docHandleRef.value;
    debug('readDoc stateDocHandler', stateDocHandler);
    const originalDoc = await stateDocHandler?.doc();
    debug('readDoc originalDoc', originalDoc);
    if (stateDocHandler === docHandleRef.value) {
      debug('doc originalDoc', () => ({ originalDoc: cloneDeep(originalDoc) }));
      const parsedDoc = checkSchema(originalDoc, zodDocumentContent);
      if (parsedDoc) {
        replaceObject(contentState.value, parsedDoc);
        debug('doc parsedDoc', () => cloneDeep(parsedDoc));
      }
    }

    return contentState.value;
  };

  const change = (callback: ChangeFn<DocumentContent>) => {
    debug('change');
    docHandleRef.value.change((doc) => {
      if (isObject(doc)) {
        callback(applyCFRDocumentMigration(doc));
      }
    });
  };

  const updateDoc = ({ doc: originalDoc }: { doc?: unknown }) => {
    debug('updateDoc originalDoc', originalDoc);
    const parsedDoc = checkSchema(originalDoc, zodDocumentContent);
    replaceObject(contentState.value, parsedDoc ?? defaultDocumentContent());
  };

  let alreadyRead = false;

  watch(
    docHandleRef,
    (docHandle, oldDocHandle) => {
      oldDocHandle?.off('change', updateDoc);
      docHandle?.on('change', updateDoc);
      if (alreadyRead) {
        void readDoc();
      }
    },
    { immediate: true },
  );

  const content = computed(() => {
    if (!alreadyRead) {
      alreadyRead = true;
      void readDoc();
    }
    return contentState.value;
  });

  tryOnScopeDispose(() => {
    debug('tryOnScopeDispose', debugId);
    docHandleRef.value?.off('change', updateDoc);
  });

  const useCFRDocumentInterface: UseCFRDocument = {
    name: computed(() => content.value.name),
    content,
    readDoc,
    change,
  };

  return useCFRDocumentInterface;
};
