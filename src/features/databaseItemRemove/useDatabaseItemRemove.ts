import type { AMDocHandle } from '@shared/lib/cfrDocument';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { useSnackbar } from '@shared/ui/Snackbar';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

export const useDatabaseItemRemove = (
  docHandler: MaybeRefOrGetter<AMDocHandle>,
) => {
  const docHandlerRef = computed(() => toValue(docHandler));

  const databaseDocument = useDatabaseDocument(docHandlerRef);

  const data = useWrapStrictRecord(
    computed(() => databaseDocument.content?.body?.data),
  );

  const { addSnackbar } = useSnackbar();

  const remove = (itemId: DatabaseItemId) => {
    if (data.value?.remove(itemId)) {
      addSnackbar({ text: `Item removed` });
    }
  };

  return {
    remove,
  };
};
