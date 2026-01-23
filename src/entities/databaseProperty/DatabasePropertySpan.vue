<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useDatabaseProperty } from './useDatabaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const { path, documentId, propertyId } = toRefs(props);

const { property } = useDatabaseProperty(path, documentId, propertyId);

const name = computed(() => property.value?.name ?? 'unknown name');
</script>

<template>
  <span class="database-property-span">
    {{ name }}
  </span>
</template>
