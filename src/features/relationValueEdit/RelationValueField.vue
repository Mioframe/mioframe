<script setup lang="ts">
import type { RelationProperty } from '@entity/databaseRelation';
import { zodRelationValue, type RelationValue } from '@entity/databaseRelation';
import { DatabaseViewChipsList } from '@entity/databaseView';
import type { AMDocHandle } from '@shared/lib/cfrDocument';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import {
  type DatabaseItemId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  value: unknown;
  directory: DirectoryFSEntry;
  property: RelationProperty;
}>();

const { directory, value, property } = toRefs(props);

const emit = defineEmits<{
  'update:value': [value: DatabaseItemId[]];
  'update:property': [property: RelationProperty];
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
  zodIs(value.value, zodRelationValue) ? value.value : [],
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

const directoryRepo = useDirectoryRepo(directory);

const relationDocumentId = computed(() => property.value.relation.documentId);

const relationDocHandle = computed(() =>
  relationDocumentId.value
    ? directoryRepo.value?.map.get(relationDocumentId.value)
    : undefined,
);

const onClickViewChip = (viewId: DatabaseViewId) => {
  emit('update:property', {
    ...property.value,
    relation: { ...property.value.relation, viewId },
  });
};

const viewId = computed(() => property.value.relation.viewId);
</script>

<template>
  <div class="relation-value-field">
    <DatabaseViewChipsList
      v-if="relationDocHandle"
      class="relation-value-field__views"
      :doc-handle="relationDocHandle"
      type="filter"
      :selected-id="viewId"
      @click="onClickViewChip"
    />

    <div v-if="relationDocHandle && viewId" class="relation-value-field__data">
      <slot
        name="data"
        :on-select="onSelect"
        :doc-handle="relationDocHandle"
        :value="relationValue"
        :view-id="viewId"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.relation-value-field {
  &__data {
    margin-top: 4step;
  }
}
</style>
