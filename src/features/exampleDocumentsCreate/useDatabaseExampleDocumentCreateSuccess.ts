import type { AMDocumentId } from '@shared/lib/automerge';
import { readonly, ref, watch } from 'vue';
import type { Ref } from 'vue';

const pendingKeys = new Set<string>();

const makeKey = (documentDirectory: string, documentId: AMDocumentId): string =>
  JSON.stringify([documentDirectory, documentId]);

/**
 * Marks a database document as having just been created from a starter example.
 * The state is in-memory only and is consumed on the first matching render.
 * @param documentDirectory - Directory path of the created document
 * @param documentId - ID of the created database document
 */
export const markDatabaseExampleDocumentCreateSuccess = (
  documentDirectory: string,
  documentId: AMDocumentId,
): void => {
  pendingKeys.add(makeKey(documentDirectory, documentId));
};

/**
 * Returns visibility state for the post-create success card for a specific database document.
 * Reacts to identity changes: the marker is consumed immediately when the matching identity is
 * observed, and the card is hidden whenever the identity no longer matches. `dismiss` only hides
 * the local card without affecting the marker.
 * @param documentDirectory - Reactive directory path of the document
 * @param documentId - Reactive ID of the database document
 * @returns `isVisible` readonly ref and `dismiss` function
 */
export const useDatabaseExampleDocumentCreateSuccess = (
  documentDirectory: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const isVisible = ref(false);

  watch(
    [documentDirectory, documentId],
    ([dir, id]) => {
      const key = makeKey(dir, id);
      if (pendingKeys.has(key)) {
        pendingKeys.delete(key);
        isVisible.value = true;
      } else {
        isVisible.value = false;
      }
    },
    { immediate: true },
  );

  const dismiss = () => {
    isVisible.value = false;
  };

  return { isVisible: readonly(isVisible), dismiss };
};
