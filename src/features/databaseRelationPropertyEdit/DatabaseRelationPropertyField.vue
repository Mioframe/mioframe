<script setup lang="ts">
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import type { Relation } from '@entity/databaseRelation';
import type { AMDocHandle } from '@shared/lib/cfrDocument';
import { useDirectoryRepo, type AMDocumentId } from '@shared/lib/cfrDocument';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { useRepo } from '@shared/lib/cfrDocument/useRepo';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDSelect } from '@shared/ui/Select';
import { computed, shallowRef, toRef } from 'vue';

const { directory } = defineProps<{
  directory: DirectoryFSEntry;
}>();

type DatabaseDocumentOption = { labelText: string; docHandle: AMDocHandle };

const selectedDocumentOptions = shallowRef<DatabaseDocumentOption[]>([]);

const { documents } = useDirectoryRepo(toRef(() => directory));

const documentList = computed(() => Array.from(documents.value.entries()));

const {} = useCFRDocument;

// todo: для формирования опций расширить интерфейс useRepo добавлением реактивным чтением документов
const databaseDocumentOptions = computed((): DatabaseDocumentOption[] =>
  documentList.value.map(([id, docHandle]) => ({
    docHandle,
    labelText: '',
  })),
);
</script>

<template>
  <MDSelect
    v-model:model-value="selectedDocumentOptions"
    label-text="Database Document"
    :options="databaseDocumentOptions"
  />
</template>
