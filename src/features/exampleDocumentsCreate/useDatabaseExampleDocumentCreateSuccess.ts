import type { AMDocumentId } from '@shared/lib/automerge';
import { readonly, ref } from 'vue';
import type { Ref } from 'vue';

const pendingKeys = new Set<string>();

const makeKey = (documentDirectory: string, documentId: AMDocumentId): string =>
  `${documentDirectory}::${documentId}`;

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
 * The marker is consumed immediately on the first matching use. `dismiss` only hides the local card.
 * @param documentDirectory - Reactive directory path of the document
 * @param documentId - Reactive ID of the database document
 * @returns `isVisible` readonly ref and `dismiss` function
 */
export const useDatabaseExampleDocumentCreateSuccess = (
  documentDirectory: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const key = makeKey(documentDirectory.value, documentId.value);
  const wasMarked = pendingKeys.has(key);
  if (wasMarked) {
    pendingKeys.delete(key);
  }

  const isVisible = ref(wasMarked);

  const dismiss = () => {
    isVisible.value = false;
  };

  return { isVisible: readonly(isVisible), dismiss };
};
