<script setup lang="ts">
import type { RelationProperty } from '@entity/databaseRelation';
import { zodRelationValue, type RelationValue } from '@entity/databaseRelation';
import { DatabaseViewChipsList } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/cfrDocument';
import {
  type DatabaseItemId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  value: unknown;
  directoryPath: string;
  property: RelationProperty;
  autofocus?: boolean;
}>();

const { directoryPath, value, property } = toRefs(props);

const emit = defineEmits<{
  'update:value': [value: DatabaseItemId[]];
  'update:property': [property: RelationProperty];
}>();

defineSlots<{
  data: (p: {
    onSelect: (itemId: DatabaseItemId) => void;
    directoryPath: string;
    documentId: AMDocumentId;
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

const relationDocumentId = computed(() => property.value.relation.documentId);

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
      :directory-path="directoryPath"
      class="relation-value-field__views"
      :document-id="relationDocumentId"
      type="filter"
      :selected-id="viewId"
      :autofocus="autofocus"
      @click="onClickViewChip"
    />

    <div v-if="viewId" class="relation-value-field__data">
      <slot
        name="data"
        :on-select="onSelect"
        :directory-path="directoryPath"
        :document-id="relationDocumentId"
        :value="relationValue"
        :view-id="viewId"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.relation-value-field {
  display: flex;
  flex-direction: column;
  overflow: auto;

  &__data {
    margin-top: 4step;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  &__views {
    --md-target-offset: 0px;
  }
}
</style>
