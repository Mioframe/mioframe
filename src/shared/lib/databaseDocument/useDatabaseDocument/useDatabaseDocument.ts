import type {
  DatabaseDocument,
  DataBaseStateLatest,
  DatabaseDocumentWithContent,
} from '../types';
import {
  zodDatabaseDocumentWithContent,
  zodDatabaseTypeDocument,
} from '../types';
import { computed, reactive } from 'vue';
import { toRefs, type MaybeRef } from '@vueuse/core';
import { useCFRDocument } from '../../cfrDocument/useCFRDocument';
import { zodIs, zodSafeCheck } from '../../validateZodScheme';
import { migrateBody, migrateDatabaseDocument } from '../migrations';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';

export const useDatabaseDocument = (
  docHandleRef: MaybeRef<AMDocHandle | undefined>,
): DatabaseDocument => {
  const cfrDocument = useCFRDocument(docHandleRef);

  const { change, content: unknownTypeContent } = toRefs(cfrDocument);

  const updateDatabaseDocument = <R>(
    update: (doc: DataBaseStateLatest) => R,
  ): Promise<R> =>
    new Promise((resolve, reject) => {
      change.value((doc) => {
        if (!zodIs(doc, zodDatabaseTypeDocument)) {
          reject(new Error('document is not DatabaseTypeDocument'));
          return;
        }

        const databaseBody: DataBaseStateLatest = migrateDatabaseDocument(doc);

        const result = update(databaseBody);

        resolve(result);
      });
    });

  const parseDocumentContent = computed(() =>
    zodSafeCheck(unknownTypeContent.value, zodDatabaseDocumentWithContent),
  );

  const documentError = computed(() => parseDocumentContent.value.error);

  const content = computed(
    (): DatabaseDocumentWithContent | undefined =>
      parseDocumentContent.value.data,
  );

  const forceApplyMigration = () =>
    updateDatabaseDocument((body) => {
      migrateBody(body, 0);
    });

  const databaseDocument: DatabaseDocument = reactive({
    content,
    update: updateDatabaseDocument,

    documentError,

    forceApplyMigration,
  });

  return databaseDocument;
};
