import type { AMDocHandle } from '@shared/lib/cfrDocument';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import { useDatabaseData } from '@shared/lib/databaseDocument';
import { useSnackbar } from '@shared/ui/Snackbar';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

export const useDatabaseItemRemove = (
  rawDocHandler: MaybeRefOrGetter<AMDocHandle>,
) => {
  const docHandler = computed(() => toValue(rawDocHandler));

  const databaseData = useDatabaseData(docHandler);

  const { addSnackbar } = useSnackbar();

  const remove = async (itemId: DatabaseItemId) => {
    await databaseData.removeItem(itemId);

    addSnackbar({ text: `Item removed` });
  };

  return {
    remove,
  };
};
