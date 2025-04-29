import type { UseDatabaseDocument } from '@shared/lib/databaseDocument/types';
import type { DatabaseViewId } from '@shared/lib/databaseDocument/state';
import { type MaybeRef } from '@vueuse/core';
import { toValue } from 'vue';

export const useDatabaseViewRemove = (
  databaseDocument: MaybeRef<UseDatabaseDocument | undefined>,
) => {
  const remove = (viewId: DatabaseViewId) =>
    toValue(databaseDocument)?.removeView(viewId);

  return {
    remove,
  };
};
