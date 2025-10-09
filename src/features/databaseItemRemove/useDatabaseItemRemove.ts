import { useDatabaseDataClient } from '@entity/databaseData/client';
import type { AMDocumentId } from '@shared/lib/cfrDocument';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import type { EntryPath } from '@shared/lib/fileSystem';
import { useSnackbar } from '@shared/ui/Snackbar';

export const useDatabaseItemRemove = () => {
  const { removeItem } = useDatabaseDataClient();

  const { addSnackbar } = useSnackbar();

  const remove = async (
    path: EntryPath,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
  ) => {
    await removeItem(path, documentId, itemId);

    addSnackbar({ text: `Item removed` });
  };

  return {
    remove,
  };
};
