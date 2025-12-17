<script setup lang="ts">
import { useDocument } from '@entity/cfrDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDSelectOption } from '@shared/ui/Select';
import { computed, toRefs } from 'vue';

const { path, documentId } =
  toRefs(
    defineProps<{
      path: string;
      documentId: AMDocumentId;
    }>(),
  );

const { state: documentDescription } = useDocument(path, documentId);

const label = computed(
  () => documentDescription.value?.name ?? 'unknown document',
);

// todo: можно перенести в entity
</script>

<template>
  <MDSelectOption :value="documentId" :label="label" />
</template>
