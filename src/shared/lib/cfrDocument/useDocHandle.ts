import type { MaybeRefOrGetter } from 'vue';
import { computed, nextTick, ref, toValue, watch } from 'vue';
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
import { defineGlobalWeakCache, useGlobalWeakCache } from '../globalWeakCache';

const createDocHandleRefState = (docHandle: AMDocHandle) => {
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

  docHandle.addListener('change', onChangeDoc);

  /**
   * Обработка события удаления из automerge
   */
  const onDeleteDoc = ({}: AMDocHandleDeletePayload) => {
    programReplaceDocRef(undefined);
  };

  docHandle.addListener('delete', onDeleteDoc);

  /**
   * Обработка изменения состояния пользователем
   */
  const watchHandle = watch(
    docRef,
    (docState) => {
      if (docState) {
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
   * Отключение обработок событий
   */
  const dispose = () => {
    docHandle.removeListener('change', onChangeDoc);
    docHandle.removeListener('delete', onDeleteDoc);

    watchHandle.stop();
  };

  /**
   * Чтение документа и актуализация состояния
   */
  const read = async () => {
    const doc: AMDoc | undefined = await docHandle.doc();

    programReplaceDocRef(doc);

    return defineReadonlyDeep(doc);
  };

  return {
    doc: docRef,
    dispose,
    read,
  };
};

export const globalCacheDocHandle = defineGlobalWeakCache(
  createDocHandleRefState,
  (_k, v) => {
    void v.read();
  },
  (_k, v) => {
    v?.dispose();
  },
);

export const useDocHandle = (
  docHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
) => {
  const docHandleRef = computed(() => toValue(docHandle));

  const change = (callback: AMChangeFn) => {
    docHandleRef.value?.change(callback);
  };

  const { state } = useGlobalWeakCache(globalCacheDocHandle, docHandleRef);

  return {
    /**
     * Изменяемое состояние документа
     */
    doc: computed(() => toValue(toValue(state)?.doc)),
    /**
     * Мутация документа
     */
    change,
  };
};
