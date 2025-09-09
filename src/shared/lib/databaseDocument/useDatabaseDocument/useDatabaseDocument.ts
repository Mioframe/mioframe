import type {
  DatabaseDocument,
  DataBaseStateLatest,
  DatabaseTypeDocument,
} from '../types';
import { zodDatabaseTypeDocument } from '../types';
import { computed, reactive } from 'vue';
import { type MaybeRef } from '@vueuse/core';
import {
  applyMigrateDatabaseBody,
  applyMigrateDatabaseDocument,
} from '../migrations';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { databaseBodyMigrations } from '../migrations/bodyMigrations';
import { isObject } from 'es-toolkit/compat';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { zodIs, zodSafeCheck } from '@shared/lib/validateZodScheme';

export const useDatabaseDocument = (
  docHandleRef: MaybeRef<AMDocHandle | undefined>,
): DatabaseDocument => {
  const cfrDocument = useCFRDocument(docHandleRef);

  const updateDatabaseDocument = <R>(
    update: (doc: DataBaseStateLatest) => R,
  ): Promise<R> =>
    new Promise((resolve, reject) => {
      cfrDocument.change((doc) => {
        if (!zodIs(doc, zodDatabaseTypeDocument)) {
          reject(new Error('document is not DatabaseTypeDocument'));
          return;
        }

        const databaseBody: DataBaseStateLatest =
          applyMigrateDatabaseDocument(doc);

        const result = update(databaseBody);

        resolve(result);
      });
    });

  const parseDocumentContent = computed(() =>
    zodSafeCheck(cfrDocument.content, zodDatabaseTypeDocument),
  );

  const documentError = computed(() => parseDocumentContent.value.error);

  const content = computed(
    (): DatabaseTypeDocument | undefined => parseDocumentContent.value.data,
  );

  const state = computed((): DataBaseStateLatest | undefined =>
    isObject(content.value?.body)
      ? databaseBodyMigrations.getLatestData(content.value.body)
      : undefined,
  );

  const forceApplyMigration = () =>
    updateDatabaseDocument((body) => {
      applyMigrateDatabaseBody(body);
    });

  const databaseDocument: DatabaseDocument = reactive({
    content,

    state,

    update: updateDatabaseDocument,

    documentError,

    forceApplyMigration,
  });

  return databaseDocument;
};
