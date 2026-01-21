<script setup lang="ts">
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { computed, toRefs } from 'vue';
import { useDatabaseProperty } from './useDatabaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDMenuItemBase } from '@shared/ui/Menu';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
  role?: string;
}>();

const { path, documentId, propertyId } = toRefs(props);

const showSubmenu = defineModel<boolean>('showSubmenu');

defineSlots<{
  submenu: () => unknown;
}>();

const { property } = useDatabaseProperty(path, documentId, propertyId);

const label = computed(() => property.value?.name ?? 'unknown property');
</script>

<template>
  <MDMenuItemBase
    v-model:show-submenu="showSubmenu"
    :label="label"
    :role="role"
  >
    <template #submenu>
      <slot name="submenu" />
    </template>
  </MDMenuItemBase>
</template>
