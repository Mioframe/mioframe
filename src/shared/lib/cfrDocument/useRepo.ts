import type { DocumentId, Repo } from '@automerge/automerge-repo';
import type { zodDocumentContent } from './types';
import type { output } from 'zod/v4-mini';
import type { MaybeRefOrGetter, ShallowReactive } from 'vue';
import {
  computed,
  reactive,
  shallowReactive,
  toRef,
  toValue,
  watch,
} from 'vue';
import type { UnknownRecord } from 'type-fest';
import type { AMDocHandle, AMDocumentId } from '../automerge/automergeTypes';
import {
  createGlobalWeakCache,
  defineGlobalWeakCache,
} from '../globalWeakCache';
import { tryOnScopeDispose } from '@vueuse/core';
import { isEqual, once, throttle } from 'es-toolkit';

export type RepoRef = {
  create: <Z extends typeof zodDocumentContent>(
    initialValue: output<Z>,
  ) => void;
  remove: (documentId: AMDocumentId) => void;
  find: (documentList: DocumentId[] | Set<DocumentId>) => void;
  map: ShallowReactive<Map<DocumentId, AMDocHandle>>;
};

const useRepoRefCacheApi = createGlobalWeakCache((repo: Repo): RepoRef => {
  const mapRef = shallowReactive<Map<AMDocumentId, AMDocHandle>>(new Map());

  const addDocToState = (docHandle: AMDocHandle) => {
    const documentId = docHandle.documentId;
    if (!mapRef.has(documentId)) {
      mapRef.set(documentId, docHandle);
    }
  };

  const removeDocFromState = (documentId: AMDocumentId) => {
    mapRef.delete(documentId);
  };

  const onDocument = ({ handle }: { handle: AMDocHandle; isNew: boolean }) => {
    addDocToState(handle);
  };

  const onDeleteDocument = ({ documentId }: { documentId: AMDocumentId }) => {
    removeDocFromState(documentId);
  };

  const addEventListeners = () => {
    repo.on('document', onDocument);

    repo.on('delete-document', onDeleteDocument);
  };

  const create = <Z extends typeof zodDocumentContent>(
    initialValue: output<Z>,
  ) => {
    repo.create(initialValue);
  };

  const remove = (documentId: AMDocumentId) => {
    repo.delete(documentId);
  };

  const documentSearchSet = shallowReactive<Set<DocumentId>>(new Set());

  const documentSearchSetWatchHandle = watch(
    documentSearchSet,
    throttle((documentSearchSet: Set<DocumentId>) => {
      documentSearchSet.forEach((documentId) => {
        if (!mapRef.has(documentId)) {
          // TODO: repo.find длительная операция
          const handle = repo.find<UnknownRecord>(documentId);
          addDocToState(handle);
        }
      });
    }, 500),
  );

  documentSearchSetWatchHandle.pause();

  const find = (documentList: DocumentId[] | Set<DocumentId>) => {
    documentList.forEach((documentId) => {
      documentSearchSet.add(documentId);
    });
  };

  tryOnScopeDispose(() => {
    repo.off('document', onDocument);

    repo.off('delete-document', onDeleteDocument);
  });

  const onceInit = once(() => {
    addEventListeners();
    documentSearchSetWatchHandle.resume();
  });

  const repoRef: RepoRef = shallowReactive({
    create,
    remove,
    find,
    get map() {
      onceInit();
      return mapRef;
    },
  });

  return repoRef;
});

const useRepoCache = defineGlobalWeakCache(useRepoRefCacheApi);

export const useRepoRef = (
  repo: MaybeRefOrGetter<Repo | undefined>,
  searchDocuments?: MaybeRefOrGetter<AMDocumentId[] | Set<AMDocumentId>>,
) => {
  const cache = useRepoCache(repo);

  const documentsForSearch = toRef(() => toValue(searchDocuments));

  const create = <Z extends typeof zodDocumentContent>(
    initialValue: output<Z>,
  ) => {
    if (!cache.value) {
      throw new Error('repository missing');
    }
    cache.value.create(initialValue);
  };

  const remove = (documentId: AMDocumentId) => {
    if (!cache.value) {
      throw new Error('repository missing');
    }
    cache.value.remove(documentId);
  };

  const map = computed(() => cache.value?.map);

  const find = (documentList: DocumentId[] | Set<DocumentId>) =>
    cache.value?.find(documentList);

  watch(
    documentsForSearch,
    (documentsForSearch, old) => {
      if (documentsForSearch && !isEqual(documentsForSearch, old)) {
        find(documentsForSearch);
      }
    },
    { immediate: true, deep: true },
  );

  const repoRef = reactive({
    create,
    remove,
    map,
    find,
  });

  return repoRef;
};
