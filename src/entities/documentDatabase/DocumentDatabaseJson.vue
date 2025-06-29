<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { toRefs } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
}>();

const { docHandle } = toRefs(props);

const cfrDocument = useCFRDocument(docHandle);
</script>

<template>
  <div class="document-database-json">
    <pre>{{ cfrDocument.content }}</pre>
  </div>
</template>
