import type { Repo } from '@automerge/automerge-repo';
import type { zodCFRDocumentContent } from './types';
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
import { createScopesWeakMap, defineScopesWeakMapRef } from '../scopesWeakMap';
import { tryOnScopeDispose } from '@vueuse/core';
import { isEqual, once, throttle } from 'es-toolkit';

export type RepoRef = {
  create: <Z extends typeof zodCFRDocumentContent>(
    initialValue: output<Z>,
  ) => void;
  remove: (documentId: AMDocumentId) => void;
  find: (documentList: AMDocumentId[] | Set<AMDocumentId>) => void;
  map: ShallowReactive<ReadonlyMap<AMDocumentId, AMDocHandle>>;
};

export const createRepoRef = (repo: Repo): RepoRef => {
  const mapRef = shallowReactive<Map<AMDocumentId, AMDocHandle>>(new Map());

  const addDocToState = (docHandle: AMDocHandle) => {
    const documentId: AMDocumentId = docHandle.documentId;
    if (!mapRef.has(documentId)) {
      mapRef.set(documentId, docHandle);
    }
  };

  const removeDocFromState = (documentId: AMDocumentId) => {
    mapRef.delete(documentId);
  };

  const onDocument = ({ handle }: { handle: AMDocHandle }) => {
    addDocToState(handle);
  };

  const onDeleteDocument = ({ documentId }: { documentId: AMDocumentId }) => {
    removeDocFromState(documentId);
  };

  const addEventListeners = () => {
    repo.on('document', onDocument);

    repo.on('delete-document', onDeleteDocument);
  };

  const create = <Z extends typeof zodCFRDocumentContent>(
    initialValue: output<Z>,
  ) => {
    repo.create(initialValue);
  };

  const remove = (documentId: AMDocumentId) => {
    repo.delete(documentId);
  };

  const documentSearchSet = shallowReactive<Set<AMDocumentId>>(new Set());

  const documentSearchSetWatchHandle = watch(
    documentSearchSet,
    throttle(async (documentSearchSet: Set<AMDocumentId>) => {
      for (const documentId of documentSearchSet) {
        if (!mapRef.has(documentId)) {
          // TODO: repo.find длительная операция?
          const handle = await repo.find<UnknownRecord>(documentId);
          addDocToState(handle);
        }
      }
    }, 500),
  );

  documentSearchSetWatchHandle.pause();

  const find = (documentList: AMDocumentId[] | Set<AMDocumentId>) => {
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
};

const useRepoScopesWeakMap = createScopesWeakMap(createRepoRef);

const useRepoScopesWeakMapRef = defineScopesWeakMapRef(useRepoScopesWeakMap);

export const useRepo = (
  repo: MaybeRefOrGetter<Repo | undefined>,
  searchDocuments?: MaybeRefOrGetter<AMDocumentId[] | Set<AMDocumentId>>,
) => {
  const repoScopes = useRepoScopesWeakMapRef(repo);

  const documentsForSearch = toRef(() => toValue(searchDocuments));

  const create = <Z extends typeof zodCFRDocumentContent>(
    initialValue: output<Z>,
  ) => {
    if (!repoScopes.value) {
      throw new Error('repository missing');
    }
    repoScopes.value.create(initialValue);
  };

  const remove = (documentId: AMDocumentId) => {
    if (!repoScopes.value) {
      throw new Error('repository missing');
    }
    repoScopes.value.remove(documentId);
  };

  const map = computed(() => repoScopes.value?.map);

  const find = (documentList: AMDocumentId[] | Set<AMDocumentId>) =>
    repoScopes.value?.find(documentList);

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
