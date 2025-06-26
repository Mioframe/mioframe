import { zodIs } from '../validateZodScheme';
import type { CFRDocument } from './types';
import { zodDocumentContent, type CFRDocumentContent } from './types';
import { applyCFRDocumentMigration } from './migrations';
import type { MaybeRefOrGetter } from 'vue';
import { computed, reactive } from 'vue';
import { isObjectLike } from 'es-toolkit/compat';
import { useDocHandleRef } from './useDocHandle';
import type { AMChangeFn, AMDocHandle } from '../automerge/automergeTypes';

export const useCFRDocument = (
  docHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
): CFRDocument => {
  const docHandleRef = useDocHandleRef(docHandle);

  /**
   * Обновление документа с миграцией
   * @param callback
   */
  const change = (callback: AMChangeFn<CFRDocumentContent>) => {
    docHandleRef.value?.change((doc) => {
      if (isObjectLike(doc)) {
        callback(applyCFRDocumentMigration(doc));
      }
    });
  };

  /**
   * Состояния документа только для чтения
   */
  const content = computed((): CFRDocumentContent | undefined =>
    zodIs(docHandleRef.value?.docRef, zodDocumentContent)
      ? docHandleRef.value.docRef
      : undefined,
  );

  const cfrDocument: CFRDocument = reactive({
    content,
    change,
  });

  return cfrDocument;
};
