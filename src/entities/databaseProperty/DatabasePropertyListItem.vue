<script setup lang="ts">
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import { useDatabaseProperty } from './useDatabaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const { path, documentId, propertyId } = toRefs(props);

const slots = defineSlots<{
  trailingIcon: (p: { property?: Readonly<DatabaseUnknownProperty> | undefined }) => unknown;
}>();

const { property } = useDatabaseProperty(path, documentId, propertyId);

const headline = computed(() => property.value?.name ?? 'unknown property');

const supportingText = computed(() => property.value?.type);
</script>

<template>
  <MDListItem :headline="headline" :supporting-text="supportingText">
    <template v-if="!!slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" :property="property" />
    </template>
  </MDListItem>
</template>
