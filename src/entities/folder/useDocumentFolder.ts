import { readonly, ref, watch, type Ref } from 'vue';
import type {
  CFRDocument,
  DocumentFolder,
  zodDocumentContent,
} from '../../shared/lib/cfrDocument';
import type { DocumentId } from '@automerge/automerge-repo';
import { tryOnScopeDispose } from '@vueuse/core';
import { updateMap } from '../../shared/lib/updateMap';
import type { TypeOf } from 'zod';
import { createLogger } from '../../shared/lib/logger';

const { debug } = createLogger('useFolder');

export const useDocumentFolder = (
  documentFolderRef: Ref<DocumentFolder | undefined>,
) => {
  const folderContent = ref(new Map<DocumentId, CFRDocument>());

  const onChangeFolder = (newContent: Map<DocumentId, CFRDocument>) => {
    debug('onChangeFolder', newContent);
    updateMap(newContent, folderContent.value);
  };

  watch(
    documentFolderRef,
    async (documentFolder, oldDocumentFolder) => {
      debug('watch documentFolderRef', documentFolder, oldDocumentFolder);
      oldDocumentFolder?.offChange(onChangeFolder);
      documentFolder?.onChange(onChangeFolder);
      if (documentFolder) {
        onChangeFolder(await documentFolder.getContent());
      } else {
        folderContent.value.clear();
      }
    },
    { immediate: true },
  );

  const createDocument = <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => documentFolderRef.value?.create(initialValue);

  tryOnScopeDispose(() => {
    documentFolderRef.value?.offChange(onChangeFolder);
  });

  return {
    content: readonly(folderContent),
    createDocument,
  };
};
