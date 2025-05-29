import { createLogger } from '../logger';
import { zodIs } from '../validateZodScheme';
import type { UseCFRDocument } from './types';
import { zodDocumentContent, type DocumentContent } from './types';
import type { ChangeFn, DocHandle } from '@automerge/automerge-repo';
import { applyCFRDocumentMigration } from './migrations';
import type { MaybeRefOrGetter } from 'vue';
import { computed } from 'vue';
import { uniqueId } from '../uniqueId';
import { isObjectLike } from 'es-toolkit/compat';
import { defineCachedDocHandle } from './useDocHandle';
import type { UnknownRecord } from 'type-fest';

const { debug } = createLogger('useCFRDocument');

const useDocHandle = defineCachedDocHandle();

export const useCFRDocument = <T extends object = UnknownRecord>(
  docHandle: MaybeRefOrGetter<DocHandle<T> | undefined>,
): UseCFRDocument => {
  const debugId = uniqueId('useCFRDocument');

  const { doc, change: docHandleChange } = useDocHandle(docHandle);

  debug('start', debugId);

  /**
   * Обновление документа с миграцией
   * @param callback
   */
  const change = (callback: ChangeFn<DocumentContent>) => {
    debug('change');
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
