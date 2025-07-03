<script setup lang="ts">
import {
  useRelationProperty,
  zodRelationValue,
  type RelationValue,
} from '@entity/databaseRelation';
import { DatabaseViewChipsList } from '@entity/databaseView';
import type { AMDocHandle } from '@shared/lib/cfrDocument';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import {
  useDatabaseViewsMap,
  type DatabaseItemId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  value: unknown;
  propertyId: DatabasePropertyId;
  directory: DirectoryFSEntry;
  docHandle: AMDocHandle;
}>();

const { directory, value, propertyId, docHandle } = toRefs(props);

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

const relationProperty = useRelationProperty(docHandle, propertyId);

const relationDocumentId = computed(
  () => relationProperty.property?.relation.documentId,
);

const relationDocHandle = computed(() =>
  relationDocumentId.value
    ? directoryRepo.value?.map.get(relationDocumentId.value)
    : undefined,
);

const selectedViewId = computed(
  () =>
    relationProperty.property?.relation.viewId ??
    databaseViewsMap.list?.at(0)?.[0],
);

const databaseViewsMap = useDatabaseViewsMap(relationDocHandle);

const onClickViewChip = async (viewId: DatabaseViewId) => {
  await relationProperty.update({
    viewId,
  });
};
</script>

<template>
  <div class="relation-value-field">
    <DatabaseViewChipsList
      v-if="relationDocHandle"
      class="relation-value-field__views"
      :doc-handle="relationDocHandle"
      type="filter"
      :selected-id="selectedViewId"
      @click="onClickViewChip"
    />

    <div
      v-if="relationDocHandle && selectedViewId"
      class="relation-value-field__data"
    >
      <slot
        name="data"
        :on-select="onSelect"
        :doc-handle="relationDocHandle"
        :value="relationValue"
        :view-id="selectedViewId"
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
