import { zodIs } from '../validateZodScheme';
import type { UseCFRDocument } from './types';
import { zodDocumentContent, type DocumentContent } from './types';
import type { ChangeFn, DocHandle } from '@automerge/automerge-repo';
import { applyCFRDocumentMigration } from './migrations';
import type { MaybeRefOrGetter } from 'vue';
import { computed } from 'vue';
import { isObjectLike } from 'es-toolkit/compat';
import { defineCachedDocHandle } from './useDocHandle';
import type { UnknownRecord } from 'type-fest';

const useDocHandle = defineCachedDocHandle();

export const useCFRDocument = <T extends object = UnknownRecord>(
  docHandle: MaybeRefOrGetter<DocHandle<T> | undefined>,
): UseCFRDocument => {
  const { doc, change: docHandleChange } = useDocHandle(docHandle);

  /**
   * Обновление документа с миграцией
   * @param callback
   */
  const change = (callback: ChangeFn<DocumentContent>) => {
    docHandleChange((doc) => {
      if (isObjectLike(doc)) {
        callback(applyCFRDocumentMigration(doc));
      }
    });
  };

  /**
   * Состояния документа только для чтения
   */
  const content = computed((): DocumentContent | undefined =>
    zodIs(doc.value, zodDocumentContent) ? doc.value : undefined,
  );

  const useCFRDocumentInterface: UseCFRDocument = {
    name: computed(() => content.value?.name),
    documentType: computed(() => content.value?.type),
    content,
    change,
  };

  return useCFRDocumentInterface;
};
