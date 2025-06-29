<script setup lang="ts">
import {
  zodRelationValue,
  type RelationProperty,
  type RelationValue,
} from '@entity/databaseRelation';
import { DatabaseViewChipsList } from '@entity/databaseView';
import type { AMDocHandle } from '@shared/lib/cfrDocument';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import type {
  DatabaseItemId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed, ref } from 'vue';

const { directory, property, value } = defineProps<{
  value: unknown;
  property: RelationProperty;
  directory: DirectoryFSEntry;
}>();

const emit = defineEmits<{
  'update:value': [value: DatabaseItemId[]];
}>();

defineSlots<{
  data: (p: {
    onSelect: (itemId: DatabaseItemId) => void;
    docHandle: AMDocHandle;
    value: DatabaseItemId[];
    viewId: DatabaseViewId;
  }) => unknown;
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

const selectedViewId = ref<DatabaseViewId>();

const onClickViewChip = (viewId: DatabaseViewId) => {
  selectedViewId.value = viewId;
};
</script>

<template>
  <div class="relation-value-field">
    <DatabaseViewChipsList
      v-if="docHandle"
      class="relation-value-field__views"
      :doc-handle
      type="filter"
      :selected-id="selectedViewId"
      @click="onClickViewChip"
    />

    <slot
      v-if="docHandle && selectedViewId"
      name="data"
      :on-select
      :doc-handle
      :value="relationValue"
      :view-id="selectedViewId"
    />
  </div>
</template>
