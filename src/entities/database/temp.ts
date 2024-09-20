import { readonly, ref, watch, type Ref } from 'vue';
import type {
  DocumentApi,
  FolderApi,
  zodDocument,
} from '../../shared/lib/documentApi';
import type { DocumentId } from '@automerge/automerge-repo';
import { tryOnScopeDispose } from '@vueuse/core';
import { updateMap } from '../../shared/lib/updateMap';
import type { TypeOf } from 'zod';
import { createLogModule } from '../../shared/lib/logger';

const { debug } = createLogModule('useFolder');

export const useFolder = (folderApi: Ref<FolderApi | undefined>) => {
  const folderContent = ref(new Map<DocumentId, DocumentApi>());

  const onChangeFolder = (newContent: Map<DocumentId, DocumentApi>) => {
    debug('onChangeFolder', newContent);
    updateMap(newContent, folderContent.value);
  };

  watch(
    folderApi,
    async (folder, oldFolder) => {
      debug('watch folderApi', folder, oldFolder);
      oldFolder?.offChange(onChangeFolder);
      folder?.onChange(onChangeFolder);
      if (folder) {
        onChangeFolder(await folder.getContent());
      } else {
        folderContent.value.clear();
      }
    },
    { immediate: true },
  );

  const createDocument = <Z extends typeof zodDocument>(
    initialValue: TypeOf<Z>,
  ) => folderApi.value?.create(initialValue);

  tryOnScopeDispose(() => {
    folderApi.value?.offChange(onChangeFolder);
  });

  return {
    content: readonly(folderContent),
    createDocument,
  };
};
