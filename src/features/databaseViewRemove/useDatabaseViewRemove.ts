import type { DatabaseDocument, ViewId } from '@shared/lib/databaseDocument';
import { toValue, type MaybeRef } from '@vueuse/core';

export const useDatabaseViewRemove = (
  databaseDocument: MaybeRef<DatabaseDocument | undefined>,
) => {
  const remove = (viewId: ViewId) => {
    toValue(databaseDocument)?.removeView(viewId);
  };
  return {
    remove,
  };
};
