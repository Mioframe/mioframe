import type { Repo } from '@automerge/automerge-repo';
import type { zodDocumentContent } from './types';
import type { output } from 'zod/v4-mini';
import type { MaybeRefOrGetter } from 'vue';
import { computed, shallowReactive, toRef, toValue, watch } from 'vue';
import { from } from 'ix/iterable';
import { createLogger } from '../logger';
import { tryOnScopeDispose } from '@vueuse/core';
import type { UnknownRecord } from 'type-fest';
import type { AMDocHandle, AMDocumentId } from './automergeTypes';

const { debug, watchDebug } = createLogger('useRepo');

export const useRepo = (
  repo: MaybeRefOrGetter<Repo | undefined>,
  searchDocuments?: MaybeRefOrGetter<Iterable<AMDocumentId>>,
) => {
  const currentRepo = toRef(() => toValue(repo));

  watchDebug('currentRepo', currentRepo);

  const documentsForSearch = toRef(() => toValue(searchDocuments));

  const documentsMap = shallowReactive<Map<AMDocumentId, AMDocHandle>>(new Map());

  const onDocument = ({ handle }: { handle: AMDocHandle; isNew: boolean }) => {
    if (!documentsMap.has(handle.documentId)) {
      documentsMap.set(handle.documentId, handle);
    }
  };

  const onDeleteDocument = ({ documentId }: { documentId: AMDocumentId }) => {
    documentsMap.delete(documentId);
  };

  const documents = computed((): Map<AMDocumentId, AMDocHandle> => {
    return documentsMap;
  });

  watchDebug('documents', documents);

  const create = <Z extends typeof zodDocumentContent>(
    initialValue: output<Z>,
  ) => {
    const repo = toValue(currentRepo);
    if (!repo) {
      throw new Error('repository missing');
    }
    repo.create(initialValue);
  };

  const remove = (documentId: AMDocumentId) => {
    const repo = toValue(currentRepo);
    if (!repo) {
      throw new Error('repository missing');
    }

    repo.delete(documentId);
  };

  watch(
    [currentRepo, documentsForSearch],
    ([newRepo, documentsForSearch], [oldRepo]) => {
      if (newRepo !== oldRepo) {
        debug('newRepo !== oldRepo');

        documentsMap.clear();

        if (oldRepo) {
          oldRepo.off('document', onDocument);

          oldRepo.off('delete-document', onDeleteDocument);
        }
        if (newRepo) {
          newRepo.on('document', onDocument);

          newRepo.on('delete-document', onDeleteDocument);
        }
      }

      debug('watch documentsForSearch', documentsForSearch);
      if (documentsForSearch && newRepo) {
        from(documentsForSearch).forEach((documentId) => {
          debug('forEach', documentId, newRepo);
          if (!documentsMap.has(documentId)) {
            debug('!documentsMap.has', documentId, newRepo);
            const handle = newRepo.find<UnknownRecord>(documentId);
            debug('documentsMap.set(documentId, handle)');
            documentsMap.set(documentId, handle);
          }
        });
      }
    },
    { immediate: true, deep: true },
  );

  tryOnScopeDispose(() => {
    debug('tryOnScopeDispose');
    const repo = toValue(currentRepo);
    if (repo) {
      repo.off('document', onDocument);

      repo.off('delete-document', onDeleteDocument);
    }
  });

  return {
    create,
    remove,
    documents,
  };
};
