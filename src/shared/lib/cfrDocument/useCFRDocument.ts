import { createLogger } from '../logger';
import { checkSchema } from '../validateZodScheme';
import type { UseCFRDocument } from './types';
import { zodDocumentContent, type DocumentContent } from './types';
import type { ChangeFn, DocHandle } from '@automerge/automerge-repo';
import { applyCFRDocumentMigration } from './migrations';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { computed, ref, toRef, toValue, watch } from 'vue';
import { replaceObject } from '../changeObject';
import { tryOnScopeDispose } from '@vueuse/core';
import { uniqueId } from '../uniqueId';
import { clone, isObjectType } from 'remeda';

const { debug } = createLogger('useCFRDocument');

const defaultDocumentContent = (): DocumentContent => ({
  name: 'unknown',
  type: 'unknown',
  body: undefined,
});

type CFRDocumentState = {
  documentContent: Ref<DocumentContent>;
  numberOfUsers: number;
  alreadyRead: boolean;
};

const cfrDocumentStateCache = new WeakMap<
  DocHandle<unknown>,
  CFRDocumentState
>();

const createCache = (docHandle: DocHandle<unknown>) => {
  const state: CFRDocumentState = {
    alreadyRead: false,
    documentContent: ref<DocumentContent>(defaultDocumentContent()),
    numberOfUsers: 0,
  };

  docHandle.on('change', updateDoc);

  cfrDocumentStateCache.set(docHandle, state);

  return state;
};

const deleteCache = (docHandle: DocHandle<unknown>) => {
  docHandle.off('change', updateDoc);
  cfrDocumentStateCache.delete(docHandle);
};

const tryDeleteCache = (docHandle: DocHandle<unknown>) => {
  const numberOfUsers =
    cfrDocumentStateCache.get(docHandle)?.numberOfUsers ?? 0;
  if (numberOfUsers <= 0) {
    deleteCache(docHandle);
  }
};

const disposeState = (docHandle: DocHandle<unknown>) => {
  const cachedState = cfrDocumentStateCache.get(docHandle);
  if (cachedState) {
    cachedState.numberOfUsers -= 1;
    tryDeleteCache(docHandle);
  }
};

const useState = (docHandle: DocHandle<unknown>): CFRDocumentState => {
  const cachedState = cfrDocumentStateCache.get(docHandle);
  if (!cachedState) {
    return createCache(docHandle);
  }
  return cachedState;
};

const updateDoc = ({
  doc: originalDoc,
  handle,
}: {
  doc?: unknown;
  handle: DocHandle<unknown>;
}) => {
  const { documentContent } = useState(handle);
  debug('updateDoc originalDoc', originalDoc);
  const parsedDoc = checkSchema(originalDoc, zodDocumentContent);
  replaceObject(documentContent.value, parsedDoc ?? defaultDocumentContent());
};

export const useCFRDocument = (
  docHandle: MaybeRefOrGetter<DocHandle<unknown> | undefined>,
): UseCFRDocument => {
  const debugId = uniqueId('useCFRDocument');

  const docHandleRef = toRef(() => toValue(docHandle));

  debug('start', debugId);

  const readDoc = async () => {
    debug('readDoc', debugId);
    const stateDocHandler = docHandleRef.value;
    if (stateDocHandler) {
      const { documentContent } = useState(stateDocHandler);

      const originalDoc = await stateDocHandler.doc();
      debug('readDoc originalDoc', originalDoc);
      if (stateDocHandler === docHandleRef.value) {
        debug('doc originalDoc', () => ({
          originalDoc: clone(originalDoc),
        }));
        const parsedDoc = checkSchema(originalDoc, zodDocumentContent);
        if (parsedDoc) {
          replaceObject(documentContent.value, parsedDoc);
          debug('doc parsedDoc', () => clone(parsedDoc));
        }
      }
      return documentContent.value;
    }
    return undefined;
  };

  const change = (callback: ChangeFn<DocumentContent>) => {
    debug('change');
    docHandleRef.value?.change((doc) => {
      if (isObjectType(doc)) {
        callback(applyCFRDocumentMigration(doc));
      }
    });
  };

  watch(
    docHandleRef,
    (docHandle, oldDocHandle) => {
      if (oldDocHandle) {
        disposeState(oldDocHandle);
      }

      if (docHandle) {
        const cachedState = cfrDocumentStateCache.get(docHandle);
        if (cachedState) {
          cachedState.numberOfUsers += 1;
        } else {
          const state = useState(docHandle);
          state.numberOfUsers += 1;

          if (state.alreadyRead) {
            void readDoc();
          }
        }
      }
    },
    { immediate: true },
  );

  const content = computed(() => {
    const docHandle = toValue(docHandleRef);
    if (docHandle) {
      const state = useState(docHandle);
      if (!state.alreadyRead) {
        state.alreadyRead = true;
        void readDoc();
      }
      return state.documentContent.value;
    }

    return undefined;
  });

  tryOnScopeDispose(() => {
    const docHandle = toValue(docHandleRef);
    if (docHandle) {
      disposeState(docHandle);
    }

    debug('tryOnScopeDispose', debugId);
  });

  const useCFRDocumentInterface: UseCFRDocument = {
    name: computed(() => content.value?.name),
    documentType: computed(() => content.value?.type),
    content,
    readDoc,
    change,
  };

  return useCFRDocumentInterface;
};
