import { computed, shallowRef, watch, type Ref } from 'vue';
import type {
  CFRDocument,
  DocumentFolder,
  zodDocumentContent,
} from '../../shared/lib/cfrDocument';
import type { DocumentId } from '@automerge/automerge-repo';
import { toValue, tryOnScopeDispose } from '@vueuse/core';
import type { TypeOf } from 'zod';
import { createLogger } from '../../shared/lib/logger';
import type { IterableCollection } from '@shared/ui/TreeMenu/useIterable';
import { from } from 'ix/Ix.asynciterable';
import { map } from 'ix/Ix.asynciterable.operators';
import { reactiveCFRDocument } from '@entity/document';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';

const { debug } = createLogger('useFolder');

export const useDocumentFolder = (
  documentFolderRef: Ref<DocumentFolder | undefined>,
) => {
  const folderContent =
    shallowRef<IterableCollection<DocumentId, CFRDocument>>();

  const onChangeFolder = (
    newContent: IterableCollection<DocumentId, CFRDocument>,
  ) => {
    folderContent.value = newContent;
  };

  watch(
    documentFolderRef,
    (documentFolder, oldDocumentFolder) => {
      debug('watch documentFolderRef', documentFolder, oldDocumentFolder);
      oldDocumentFolder?.offChange(onChangeFolder);
      documentFolder?.onChange(onChangeFolder);
      if (documentFolder) {
        onChangeFolder(documentFolder.children);
      } else {
        folderContent.value = undefined;
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

  const content = computed(() => {
    const content = toValue(folderContent.value);
    if (content) {
      return from(content).pipe(
        map(([id, doc]): [DocumentId, ReactiveCFRDocument] => {
          return [id, reactiveCFRDocument(doc)];
        }),
      );
    }
    return undefined;
  });

  return {
    content,
    createDocument,
  };
};
