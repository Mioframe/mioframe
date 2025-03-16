<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { toRef } from 'vue';

/**
 * Виджет просмотра документа
 */

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const { content } = useCFRDocument(toRef(() => docHandle));
</script>

<template>
  <div class="document-view-widget">
    <pre>{{ content }}</pre>
  </div>
</template>

<style lang="css" scoped>
.document-view-widget {
  position: relative;
  flex: 1 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
</style>
