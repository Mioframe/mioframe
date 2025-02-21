import { computed, shallowRef, toValue, watch, type Ref } from 'vue';
import type {
  CFRDocument,
  DocumentFolder,
  zodDocumentContent,
} from '../../shared/lib/cfrDocument';
import type { DocumentId } from '@automerge/automerge-repo';
import { tryOnScopeDispose } from '@vueuse/core';
import type { TypeOf } from 'zod';
import { createLogger } from '../../shared/lib/logger';
import type { Collection } from '@shared/ui/TreeMenu/useIterable';
import { from } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';
import { reactiveCFRDocument } from '@entity/document';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import { zodDocumentId } from '@shared/lib/fsStorageAdapter';
import { is } from '@shared/lib/validateZodScheme';
import { isNil } from 'lodash-es';

const { debug } = createLogger('useFolder');

export const useDirectoryEntry = (
  documentFolderRef: Ref<DocumentFolder | undefined>,
) => {
  const folderContent =
    shallowRef<
      Collection<[DocumentId, CFRDocument] | [string, DocumentFolder]>
    >();

  const onChangeFolder = (
    newContent: Collection<
      [DocumentId, CFRDocument] | [string, DocumentFolder]
    >,
  ) => {
    debug('onChangeFolder');
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
  ) => documentFolderRef.value?.createDocument(initialValue);

  tryOnScopeDispose(() => {
    documentFolderRef.value?.offChange(onChangeFolder);
  });

  const content = computed(() => {
    const content = toValue(folderContent.value);
    debug('computed content', content);
    if (content) {
      return from(content).pipe(
        map(
          ([key, item]):
            | [DocumentId, ReactiveCFRDocument]
            | [string, DocumentFolder]
            | undefined => {
            if (is(key, zodDocumentId) && 'doc' in item) {
              return [key, reactiveCFRDocument(item)];
            } else if ('createDocument' in item) {
              return [key, item];
            }
            return undefined;
          },
        ),
        filter((v) => !isNil(v)),
      );
    }
    return undefined;
  });

  return {
    content,
    createDocument,
  };
};
