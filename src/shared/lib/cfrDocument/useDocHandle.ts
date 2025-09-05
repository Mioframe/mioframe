import { reactive, readonly, ref } from 'vue';
import { deepReplaceJsonObject } from '../changeObject';
import { defineReadonlyDeep } from '../readonlyDeep';
import type { UnknownRecord } from 'type-fest';
import type {
  AMChangeFn,
  AMDoc,
  AMDocHandle,
  AMDocHandleChangePayload,
  AMDocHandleDeletePayload,
} from '../automerge/automergeTypes';
import {
  createGlobalWeakCache,
  defineGlobalWeakCacheRef,
} from '../globalWeakCache';
import { tryOnScopeDispose } from '@vueuse/core';
import type { ReadonlyObjectDeep } from 'type-fest/source/readonly-deep';

export type DocHandleRef = {
  docRef: UnknownRecord;
  doc: () => ReadonlyObjectDeep<AMDoc> | undefined;
  change: (callback: AMChangeFn) => void;
};

const createDocHandleRefState = (docHandle: AMDocHandle): DocHandleRef => {
  const docRef = ref<UnknownRecord>({});

  /**
   * Изменение состояния без триггера
   */
  const programReplaceDocRef = (doc: AMDoc | undefined) => {
    if (doc) {
      deepReplaceJsonObject(docRef.value, doc, { trimString: true });
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

export const useDocHandleRefApi = createGlobalWeakCache(
  createDocHandleRefState,
);

export const useDocHandleRef = defineGlobalWeakCacheRef(useDocHandleRefApi);
