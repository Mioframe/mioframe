<script setup lang="ts">
import type { Relation } from '@entity/databaseRelation';
import { type AMDocumentId } from '@shared/lib/cfrDocument';
import { useDocumentFolder } from '@shared/lib/cfrDocument/useDocumentFolder';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDSelect } from '@shared/ui/Select';
import { computed, nextTick, reactive, shallowRef, watch } from 'vue';

const { directory } = defineProps<{
  directory: DirectoryFSEntry;
}>();

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

const directoryRef = computed(() => directory);

const documentFolder = useDocumentFolder(directoryRef);

const documentMap = computed(() => documentFolder.value?.documentMap);

const documentNamesMap = reactive(new Map<AMDocumentId, string>());

// заполнение documentNamesMap
watch(
  documentMap,
  (documentMap) => {
    const oldNames = new Set(documentNamesMap.keys());
    documentMap?.forEach((doc, documentId) => {
      oldNames.delete(documentId);
      if (!documentNamesMap.has(documentId)) {
        const name = doc.content?.name;
        if (name) {
          documentNamesMap.set(documentId, name);
        }
      }
    });

    oldNames.forEach((documentId) => {
      documentNamesMap.delete(documentId);
    });
  },
  { immediate: true },
);

const documentOptionList = computed((): DatabaseDocumentOption[] =>
  Array.from(documentNamesMap.entries()).map(
    ([documentId, name]): DatabaseDocumentOption => ({
      label: name,
      key: documentId,
    }),
  ),
);

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
          label: documentNamesMap.get(documentId) ?? 'unknown document name',
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
