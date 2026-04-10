import { useDatabaseData } from '@entity/databaseData/useDatabaseData';
import type { AMDocumentId } from '@shared/lib/cfrDocument';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import { useSnackbar } from '@shared/ui/Snackbar';
import type { Ref } from 'vue';

export const useDatabaseItemRemove = (path: Ref<string>, documentId: Ref<AMDocumentId>) => {
  const { removeItem } = useDatabaseData(path, documentId);

  const { addSnackbar } = useSnackbar();

  const remove = async (itemId: DatabaseItemId) => {
    await removeItem(itemId);

    addSnackbar({ text: `Item removed` });
  };

  return {
    remove,
  };
};
