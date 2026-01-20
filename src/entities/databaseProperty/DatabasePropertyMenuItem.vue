<script setup lang="ts">
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { computed, toRefs } from 'vue';
import { useDatabaseProperty } from './useDatabaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDMenuItem } from '@shared/ui/Menu';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const { path, documentId, propertyId } = toRefs(props);

const slots = defineSlots<{
  trailingIcon: (p: { property?: DatabaseUnknownProperty }) => unknown;
}>();

const { property } = useDatabaseProperty(path, documentId, propertyId);

const headline = computed(() => property.value?.name ?? 'unknown property');

const supportingText = computed(() => property.value?.type);
</script>

<template>
  <MDMenuItem :item="{ key, label }" />
</template>
