<script setup lang="ts">
import {
  zodRelationValue,
  type RelationProperty,
  type RelationValue,
} from '@entity/databaseRelation';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed } from 'vue';

const { directory, property, value } = defineProps<{
  value: unknown;
  property: RelationProperty;
  directory: DirectoryFSEntry;
}>();

const emit = defineEmits<{
  'update:value': [value: DatabaseItemId[]];
}>();

const relationValue = computed<RelationValue>(() =>
  zodIs(value, zodRelationValue) ? value : [],
);

const onSelect = (itemId: DatabaseItemId) => {
  if (relationValue.value.includes(itemId)) {
    emit(
      'update:value',
      relationValue.value.filter((v) => v !== itemId),
    );
  } else {
    emit('update:value', [...relationValue.value, itemId]);
  }
};

const directoryRef = computed(() => directory);

const directoryRepo = useDirectoryRepo(directoryRef);

const documentId = computed(() => property.relation.documentId);

const docHandle = computed(() =>
  directoryRepo.value?.map.get(documentId.value),
);
</script>

<template>
  <div class="relation-value-field">
    <!-- фильтрация -->
    <!-- // виджет Data с кнопками выбора -->
    <slot name="data" :on-select />
  </div>
</template>
