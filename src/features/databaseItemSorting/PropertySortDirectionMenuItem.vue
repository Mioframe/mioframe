<script setup lang="ts">
import { useDatabaseProperty } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import MDMenuItem from '@shared/ui/Menu/MDMenuItem.vue';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { path, documentId, propertyId } = toRefs(props);

const { property } = useDatabaseProperty(path, documentId, propertyId);

const item = computed(() => ({
  label: property.value?.name ?? 'unknown property',
  key: propertyId.value,
}));

const onMenuItemClick = () => {
  emit('click');
};
</script>

<template>
  <MDMenuItem :item="item" @click="onMenuItemClick" />
</template>
