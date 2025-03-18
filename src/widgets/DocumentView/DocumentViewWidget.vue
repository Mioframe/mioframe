<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { toRef } from 'vue';
import DatabaseView from './DatabaseViewWidget.vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';

/**
 * Виджет просмотра документа
 */

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const { content, documentType } = useCFRDocument(toRef(() => docHandle));
</script>

<template>
  <div class="document-view-widget">
    <DatabaseView
      v-if="documentType === DATABASE_DOCUMENT_TYPE"
      :doc-handle="docHandle"
    />

    <pre v-else>{{ content }}</pre>
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
