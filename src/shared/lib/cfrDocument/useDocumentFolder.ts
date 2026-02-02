import { effectScope } from 'vue';
import { computed, reactive, shallowReactive, watch } from 'vue';
import type { WritableDirectoryFSEntry } from '../fileSystem';
import { defineScopePool, createUsePoolHook } from '../scopePool';
import { useDirectoryRepo } from './useDirectoryRepo';
import type { AMDocumentId } from '../automerge';
import type { CFRDocument } from './types';
import { useCFRDocument } from './useCFRDocument';
import { tryOnScopeDispose } from '@vueuse/core';

export const documentFolderPool = defineScopePool(
  (directory: WritableDirectoryFSEntry) => {
    const directoryRepo = useDirectoryRepo(directory);

    const documentMap = shallowReactive(new Map<AMDocumentId, CFRDocument>());
    const scopeMap = new Map<AMDocumentId, ReturnType<typeof effectScope>>();

    const stopScope = (documentId?: AMDocumentId) => {
      if (documentId) {
        const scope = scopeMap.get(documentId);
        scope?.stop();
        scopeMap.delete(documentId);
      } else {
        scopeMap.forEach((scope) => {
          scope.stop();
        });
        scopeMap.clear();
      }
    };

    const directoryRepoMap = computed(() => directoryRepo.value?.map);

    watch(
      directoryRepoMap,
      (directoryRepoMap) => {
        if (directoryRepoMap) {
          const oldDocumentIdSet = new Set(documentMap.keys());
          directoryRepoMap.forEach((docHandle, documentId) => {
            oldDocumentIdSet.delete(documentId);
            if (!documentMap.has(documentId)) {
              const scope = effectScope();
              const cfrDocument = scope.run(() => useCFRDocument(docHandle));
              if (cfrDocument) {
                documentMap.set(documentId, cfrDocument);
                scopeMap.set(documentId, scope);
              }
            }
          });

          oldDocumentIdSet.forEach((documentId) => {
            documentMap.delete(documentId);
            stopScope(documentId);
          });
        } else {
          documentMap.clear();
          stopScope();
        }
      },
      { immediate: true, deep: true },
    );

    tryOnScopeDispose(() => {
      stopScope();
    });

    return reactive({
      documentMap,
    });
  },
);

export const useDocumentFolder = createUsePoolHook(documentFolderPool);
