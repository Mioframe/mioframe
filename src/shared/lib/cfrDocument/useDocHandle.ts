import type { MaybeRefOrGetter, Ref } from 'vue';
import { computed, nextTick, ref, shallowRef, toValue, watch } from 'vue';
import { isUnknownRecord, deepReplaceJsonObject } from '../changeObject';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import { defineReadonlyDeep } from '../readonlyDeep';
import type { UnknownRecord } from 'type-fest';
import type {
  AMChangeFn,
  AMDoc,
  AMDocHandle,
  AMDocHandleChangePayload,
  AMDocHandleDeletePayload,
} from '../automerge/automergeTypes';

const createDocHandleRefState = <T extends object>(
  docHandle: AMDocHandle<T>,
) => {
  const docRef = ref<T | UnknownRecord>({});

  /**
   * Изменение состояния без триггера
   */
  const programReplaceDocRef = (doc: AMDoc<T> | undefined) => {
    watchHandle.pause();
    if (doc) {
      deepReplaceJsonObject(docRef.value, doc);
    }
    void nextTick(() => {
      watchHandle.resume();
    });
  };

  /**
   * Обработка события изменения из automerge
   */
  const onChangeDoc = ({ doc }: AMDocHandleChangePayload<T>) => {
    programReplaceDocRef(doc);
  };

  docHandle.addListener('change', onChangeDoc);

  /**
   * Обработка события удаления из automerge
   */
  const onDeleteDoc = ({}: AMDocHandleDeletePayload<T>) => {
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
    const doc: AMDoc<T> | undefined = await docHandle.doc();

    programReplaceDocRef(doc);

    return defineReadonlyDeep(doc);
  };

  return {
    doc: docRef,
    dispose,
    read,
  };
};

export const defineCachedDocHandle = createGlobalState(() => {
  const cacheDocHandleState = new WeakMap<
    AMDocHandle<object>,
    { doc: Ref; dispose: () => unknown }
  >();

  const usersDocHandleState = new WeakMap<AMDocHandle<object>, number>();

  const getCachedDocHandlerState = <T extends object>(
    docHandle: AMDocHandle<T>,
  ) => {
    const countUsers = (usersDocHandleState.get(docHandle) ?? 0) + 1;
    usersDocHandleState.set(docHandle, countUsers);

    const cachedDocHandleState = cacheDocHandleState.get(docHandle);

    if (cachedDocHandleState) {
      return cachedDocHandleState;
    }

    const docHandleRefState = createDocHandleRefState(docHandle);
    cacheDocHandleState.set(docHandle, docHandleRefState);

    if (countUsers === 1) {
      void docHandleRefState.read();
    }

    return docHandleRefState;
  };

  const tryDisposeDocHandle = <T extends object>(docHandle: AMDocHandle<T>) => {
    const oldCountUsers = usersDocHandleState.get(docHandle) ?? 0;

    usersDocHandleState.set(docHandle, oldCountUsers - 1);

    if ((usersDocHandleState.get(docHandle) ?? 0) <= 0) {
      const cachedDocHandlerState = cacheDocHandleState.get(docHandle);
      cachedDocHandlerState?.dispose();
      cacheDocHandleState.delete(docHandle);
    }
  };

  const useDocHandle = <T extends object = UnknownRecord>(
    docHandle: MaybeRefOrGetter<AMDocHandle<T> | undefined>,
  ) => {
    const docHandleRef = computed(() => toValue(docHandle));

    const cachedState = shallowRef<{
      doc: Ref<T | undefined>;
    }>();

    watch(
      docHandleRef,
      (docHandle, oldDocHandle) => {
        if (oldDocHandle) {
          tryDisposeDocHandle(oldDocHandle);
        }
        if (docHandle) {
          cachedState.value = getCachedDocHandlerState(docHandle);
        } else {
          cachedState.value = undefined;
        }
      },
      { immediate: true },
    );

    tryOnScopeDispose(() => {
      if (docHandleRef.value) {
        tryDisposeDocHandle(docHandleRef.value);
      }
    });

    const change = (callback: AMChangeFn<T>) => {
      docHandleRef.value?.change(callback);
    };

    return {
      /**
       * Изменяемое состояние документа
       */
      doc: computed(() => toValue(toValue(cachedState)?.doc)),
      /**
       * Мутация документа
       */
      change,
    };
  };

  return useDocHandle;
});
