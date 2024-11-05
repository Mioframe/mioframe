import { cloneDeep, isNil } from 'lodash-es';
import { type Ref, ref, watch, computed } from 'vue';
import { replaceObject } from '../../shared/lib/changeObject';
import type {
  DatabaseDocument,
  DataBaseStateLatest,
  DatabaseDocumentContent,
} from '../../shared/lib/databaseDocument';
import { pickDictionaryBy } from '@/shared/lib/pickDictionaryBy';

export const useDatabaseDocument = (
  databaseDocumentRef: Ref<DatabaseDocument | undefined>,
) => {
  const databaseState = ref<DataBaseStateLatest>();

  let offChange: (() => void) | undefined;

  const changeDatabaseState = (doc?: DatabaseDocumentContent) => {
    if (!databaseState.value) {
      databaseState.value = cloneDeep(doc?.body);
    } else {
      replaceObject(databaseState.value, doc?.body ?? {});
    }
  };

  watch(
    databaseDocumentRef,
    async (databaseDocument) => {
      offChange?.();
      offChange = undefined;
      if (databaseDocument) {
        offChange = databaseDocument.onChange(changeDatabaseState);
        const doc = await databaseDocument.read();
        changeDatabaseState(doc);
      }
    },
    { immediate: true },
  );

  const state = computed(() => databaseState.value);

  const properties = computed(() =>
    state.value?.properties
      ? pickDictionaryBy(state.value.properties, (v) => !isNil(v))
      : undefined,
  );

  const views = computed(() =>
    state.value?.views
      ? pickDictionaryBy(state.value.views, (v) => !isNil(v))
      : {},
  );

  return {
    properties,
    state,
    views,
  };
};
