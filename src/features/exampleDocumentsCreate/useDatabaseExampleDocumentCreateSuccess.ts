import type { AMDocumentId } from '@shared/lib/automerge';
import { computed, reactive } from 'vue';
import type { Ref } from 'vue';

const pendingKeys = reactive(new Set<string>());

const makeKey = (documentDirectory: string, documentId: AMDocumentId): string =>
  `${documentDirectory}::${documentId}`;

/**
 * Marks a database document as having just been created from a starter example.
 * The state is in-memory only and is cleared when dismissed.
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
 * Returns reactive visibility state for the post-create success card for a specific database document.
 * The card is visible only immediately after starter example creation and is cleared on dismiss.
 * @param documentDirectory - Reactive directory path of the document
 * @param documentId - Reactive ID of the database document
 * @returns `isVisible` computed ref and `dismiss` function
 */
export const useDatabaseExampleDocumentCreateSuccess = (
  documentDirectory: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const isVisible = computed(() =>
    pendingKeys.has(makeKey(documentDirectory.value, documentId.value)),
  );

  const dismiss = () => {
    pendingKeys.delete(makeKey(documentDirectory.value, documentId.value));
  };

  return { isVisible, dismiss };
};
