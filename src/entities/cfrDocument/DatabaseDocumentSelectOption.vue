<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDSelectOption } from '@shared/ui/Select';
import { computed, toRefs } from 'vue';
import { useDocument } from './useDocument';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
}>();

const { path, documentId } = toRefs(props);

const { state: documentDescription } = useDocument(path, documentId);

const label = computed(
  () => documentDescription.value?.name ?? 'unknown document',
);
</script>

<template>
  <MDSelectOption :value="documentId" :label="label" />
</template>
