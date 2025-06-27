<script setup lang="ts">
import type { Relation } from '@entity/databaseRelation';
import { type AMDocumentId } from '@shared/lib/cfrDocument';
import { useDocumentFolder } from '@shared/lib/cfrDocument/useDocumentFolder';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDSelect } from '@shared/ui/Select';
import { computed, reactive, shallowRef, watch } from 'vue';

const { directory } = defineProps<{
  directory: DirectoryFSEntry;
}>();

const relationModel = defineModel<Relation>();

type DatabaseDocumentOption = { labelText: string; documentId: AMDocumentId };

const selectedDocumentOptions = shallowRef<DatabaseDocumentOption[]>([]);

const directoryRef = computed(() => directory);

const documentFolder = useDocumentFolder(directoryRef);

const documentMap = computed(() => documentFolder.value?.documentMap);

const documentNamesMap = reactive(new Map<AMDocumentId, string>());

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
      labelText: name,
      documentId,
    }),
  ),
);

watch(selectedDocumentOptions, ([{ documentId }]) => {
  relationModel.value = { ...relationModel.value, documentId };
});
</script>

<template>
  <MDSelect
    v-model:model-value="selectedDocumentOptions"
    label-text="Database Document"
    :options="documentOptionList"
  />
</template>
