import { zodIs } from '../validateZodScheme';
import type { UseCFRDocument } from './types';
import { zodDocumentContent, type DocumentContent } from './types';
import { applyCFRDocumentMigration } from './migrations';
import type { MaybeRefOrGetter } from 'vue';
import { computed } from 'vue';
import { isObjectLike } from 'es-toolkit/compat';
import { useDocHandleRef } from './useDocHandle';
import type { AMChangeFn, AMDocHandle } from '../automerge/automergeTypes';

export const useCFRDocument = (
  docHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
): UseCFRDocument => {
  const docHandleRef = useDocHandleRef(docHandle);

  /**
   * Обновление документа с миграцией
   * @param callback
   */
  const change = (callback: AMChangeFn<DocumentContent>) => {
    docHandleRef.value?.change((doc) => {
      if (isObjectLike(doc)) {
        callback(applyCFRDocumentMigration(doc));
      }
    });
  };

  /**
   * Состояния документа только для чтения
   */
  const content = computed((): DocumentContent | undefined =>
    zodIs(docHandleRef.value?.docRef, zodDocumentContent)
      ? docHandleRef.value.docRef
      : undefined,
  );

  const useCFRDocumentInterface: UseCFRDocument = {
    name: computed(() => content.value?.name),
    documentType: computed(() => content.value?.type),
    content,
    change,
  };

  return useCFRDocumentInterface;
};
