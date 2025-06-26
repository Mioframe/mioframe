import { nextTick, reactive, ref, watch } from 'vue';
import { isUnknownRecord, deepReplaceJsonObject } from '../changeObject';
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
  defineGlobalWeakCache,
} from '../globalWeakCache';
import { tryOnScopeDispose } from '@vueuse/core';
import type { ReadonlyObjectDeep } from 'type-fest/source/readonly-deep';
import { once } from 'es-toolkit';

export type DocHandleRef = {
  docRef: UnknownRecord;
  doc: () => Promise<ReadonlyObjectDeep<AMDoc> | undefined>;
  change: (callback: AMChangeFn) => void;
};

const createDocHandleRefState = (docHandle: AMDocHandle): DocHandleRef => {
  const docRef = ref<UnknownRecord>({});

  /**
   * Изменение состояния без триггера
   */
  const programReplaceDocRef = (doc: AMDoc | undefined) => {
    watchHandle.pause();
    if (doc) {
      deepReplaceJsonObject(docRef.value, doc);
    } else {
      docRef.value = {};
    }
    void nextTick(() => {
      watchHandle.resume();
    });
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
   * Обработка изменения состояния пользователем
   */
  const watchHandle = watch(
    docRef,
    (docState) => {
      if (isUnknownRecord(docState)) {
        docHandle.change((doc) => {
          if (isUnknownRecord(doc)) {
            deepReplaceJsonObject(doc, docState);
          }
        });
      }
    },
    { deep: true },
  );

  /**
   * Чтение документа и актуализация состояния
   */
  const doc = async () => {
    const doc: AMDoc | undefined = await docHandle.doc();

    programReplaceDocRef(doc);

    return defineReadonlyDeep(doc);
  };

  const change = (callback: AMChangeFn) => {
    docHandle.change(callback);
  };

  tryOnScopeDispose(() => {
    docHandle.removeListener('change', onChangeDoc);
    docHandle.removeListener('delete', onDeleteDoc);

    watchHandle.stop();
  });

  const onceInit = once(() => {
    docHandle.addListener('change', onChangeDoc);
    docHandle.addListener('delete', onDeleteDoc);

    void doc();
  });

  const docHandleRef: DocHandleRef = reactive({
    get docRef() {
      onceInit();
      return docRef;
    },
    doc,
    change,
  });

  return docHandleRef;
};

export const useDocHandleRefApi = createGlobalWeakCache(
  createDocHandleRefState,
);

export const useDocHandleRef = defineGlobalWeakCache(useDocHandleRefApi);
