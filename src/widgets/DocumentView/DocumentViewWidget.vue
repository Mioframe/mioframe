<script setup lang="ts">
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { toRef } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import DatabaseViewWidget from './Database/DatabaseViewWidget.vue';
import type { AMDocHandle } from '@shared/lib/cfrDocument/automergeTypes';

/**
 * Виджет просмотра документа
 */

const { docHandle } = defineProps<{
  docHandle: AMDocHandle;
}>();

const { content, documentType } = useCFRDocument(toRef(() => docHandle));
</script>

<template>
  <div class="document-view-widget">
    <DatabaseViewWidget
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
