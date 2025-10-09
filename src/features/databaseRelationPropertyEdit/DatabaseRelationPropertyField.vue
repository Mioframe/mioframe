<script setup lang="ts">
import { useCFRDocumentClient } from '@entity/cfrDocument';
import type { Relation } from '@entity/databaseRelation';
import { useDocumentRepoClient } from '@entity/documentRepo';
import { type AMDocumentId } from '@shared/lib/cfrDocument';
import { DomainError } from '@shared/lib/error';
import type { EntryPath } from '@shared/lib/fileSystem';
import { MDSelect } from '@shared/ui/Select';
import { computed, nextTick, shallowRef, toRefs, watch } from 'vue';

const props = defineProps<{
  directoryPath: EntryPath;
}>();

const { directoryPath } = toRefs(props);

const relationModel = defineModel<Relation>();

const relationDocumentIdModel = computed({
  get: () => relationModel.value?.documentId,
  set: (documentId: AMDocumentId) =>
    (relationModel.value = {
      ...relationModel.value,
      documentId,
    }),
});

type DatabaseDocumentOption = { label: string; key: AMDocumentId };

const selectedDocumentOptions = shallowRef<DatabaseDocumentOption[]>([]);

const { getDocumentIdList } = useDocumentRepoClient();

const documentIdList = computed(() => getDocumentIdList(directoryPath.value));

const { getDocumentDescription } = useCFRDocumentClient();

const documentOptionList = computed((): DatabaseDocumentOption[] => {
  if (documentIdList.value && !(documentIdList.value instanceof DomainError)) {
    return documentIdList.value.map((documentId): DatabaseDocumentOption => {
      const label =
        getDocumentDescription(directoryPath.value, documentId)?.name ??
        'unknown document name';
      return { key: documentId, label };
    });
  }
  return [];
});

const selectedDocumentOptionsWatchHandle = watch(
  selectedDocumentOptions,
  ([{ key: documentId }]) => {
    relationDocumentIdWatchHandle.pause();
    relationDocumentIdModel.value = documentId;
    void nextTick(relationDocumentIdWatchHandle.resume);
  },
);

const relationDocumentIdWatchHandle = watch(
  relationDocumentIdModel,
  (documentId) => {
    selectedDocumentOptionsWatchHandle.pause();
    if (documentId) {
      selectedDocumentOptions.value = [
        {
          key: documentId,
          label:
            getDocumentDescription(directoryPath.value, documentId)?.name ??
            'unknown document name',
        },
      ];
    }

    void nextTick(selectedDocumentOptionsWatchHandle.resume);
  },
  { immediate: true },
);
</script>

<template>
  <MDSelect
    v-model:model-value="selectedDocumentOptions"
    label-text="Database Document"
    :options="documentOptionList"
  />
</template>
