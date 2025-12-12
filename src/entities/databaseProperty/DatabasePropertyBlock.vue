<script setup lang="ts">
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { useDatabaseProperty } from './useDatabaseProperty';
import { computed, toRefs } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';

const { path, documentId, propertyId } =
  toRefs(
    defineProps<{
      path: string;
      documentId: AMDocumentId;
      propertyId: DatabasePropertyId;
    }>(),
  );

defineSlots<{
  default: (p: { property?: DatabaseUnknownProperty }) => unknown;
}>();

const { property } = useDatabaseProperty(path, documentId, propertyId);

const name = computed(() => property.value?.name ?? 'unknown property');
</script>

<template>
  <div class="database-property-block">
    <slot :property="property">
      <span>{{ name }}</span>
    </slot>
  </div>
</template>
