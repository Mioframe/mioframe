import { reactive, readonly, ref } from 'vue';
import { deepPutJsonObject } from '../changeObject';
import { defineReadonlyDeep } from '../readonlyDeep';
import type { ReadonlyDeep, UnknownRecord } from 'type-fest';
import type {
  AMChangeFn,
  AMDoc,
  AMDocHandle,
  AMDocHandleChangePayload,
  AMDocHandleDeletePayload,
} from '../automerge/automergeTypes';
import { createScopesWeakMap, defineScopesWeakMapRef } from '../scopesWeakMap';
import { tryOnScopeDispose } from '@vueuse/core';

export type DocHandleRef = {
  docRef: UnknownRecord;
  doc: () => ReadonlyDeep<AMDoc> | undefined;
  change: (callback: AMChangeFn) => void;
};

export const createDocHandleRef = (docHandle: AMDocHandle): DocHandleRef => {
  const docRef = ref<UnknownRecord>({});

  /**
   * Изменение состояния без триггера
   */
  const programReplaceDocRef = (doc: AMDoc | undefined) => {
    if (doc) {
      deepPutJsonObject(docRef.value, doc, { trimString: true });
    } else {
      docRef.value = {};
    }
  };

  /**
   * Обработка события изменения из automerge
   */
  const onChangeDoc = ({ doc }: AMDocHandleChangePayload) => {
    programReplaceDocRef(doc);
  };

  /**
   * Обработка события удаления из automerge
   */
  const onDeleteDoc = ({}: AMDocHandleDeletePayload) => {
    programReplaceDocRef(undefined);
  };

  /**
   * Чтение документа и актуализация состояния
   */
  const doc = () => {
    const doc: AMDoc | undefined = docHandle.doc();

    programReplaceDocRef(doc);

    return defineReadonlyDeep(doc);
  };

  const change = (callback: AMChangeFn) => {
    docHandle.change(callback);
  };

  let isInitialized = false;

  tryOnScopeDispose(() => {
    dispose();
  });

  const dispose = () => {
    if (isInitialized) {
      docHandle.removeListener('change', onChangeDoc);
      docHandle.removeListener('delete', onDeleteDoc);
      isInitialized = false;
    }
  };

  const init = () => {
    if (!isInitialized) {
      isInitialized = true;

      docHandle.addListener('change', onChangeDoc);
      docHandle.addListener('delete', onDeleteDoc);

      void doc();
    }
  };

  const docHandleRef: DocHandleRef = reactive({
    get docRef() {
      init();
      return readonly(docRef);
    },
    doc,
    change,
  });

  return docHandleRef;
};

export const useDocHandleScopesWeakMap =
  createScopesWeakMap(createDocHandleRef);

export const useDocHandleScopesWeakMapRef = defineScopesWeakMapRef(
  useDocHandleScopesWeakMap,
);
