<script setup lang="ts">
import { computed, ref, toRefs, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import {
  type DatabaseItem,
  type DatabaseItemId,
  type DatabasePropertyId,
  type GeneralProperty,
} from '@shared/lib/databaseDocument';
import type { AMDocumentId } from '@shared/lib/automerge';

import type { EntryPath } from '@shared/lib/fileSystem';
import { useDatabaseDataClient } from '@entity/databaseData/client';
import { DomainError } from '@shared/lib/error';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import { strictRecordIterableEntries } from '@shared/lib/strictRecord';

const props = withDefaults(
  defineProps<{
    directoryPath: EntryPath;
    documentId: AMDocumentId;
    itemId?: DatabaseItemId;
    headline?: string;
    supportingText?: string;
    applyLabel?: string;
  }>(),
  {
    applyLabel: 'Apply',
    headline: 'Edit item',
    supportingText: 'Fill in the item properties.',
  },
);

const {
  directoryPath,
  documentId,
  applyLabel,
  headline,
  supportingText,
  itemId,
} = toRefs(props);

const emit = defineEmits<{
  updated: [item: DatabaseItem];
  created: [id: DatabaseItemId];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

defineSlots<{
  valueField(p: {
    property: GeneralProperty;
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const itemState = ref<DatabaseItem>({});

const { getItem, postItem } = useDatabaseDataClient();

const currentItemState = computed(() =>
  itemId.value
    ? getItem(directoryPath.value, documentId.value, itemId.value)
    : undefined,
);

watchEffect(() => {
  if (!(currentItemState.value instanceof DomainError)) {
    itemState.value = currentItemState.value ?? {};
  }
});

const onApply = async () => {
  if (itemId.value) {
    await postItem(
      directoryPath.value,
      documentId.value,
      itemState.value,
      itemId.value,
    );
    emit('updated', itemState.value);
  } else {
    const id = await postItem(
      directoryPath.value,
      documentId.value,
      itemState.value,
    );
    emit('created', id);
  }
};

const onCancel = () => {
  itemState.value = {};
  emit('cancel');
};

const { getDatabaseProperties } = useDatabasePropertiesClient();

const properties = computed(() => {
  const properties = getDatabaseProperties(
    directoryPath.value,
    documentId.value,
  );

  if (properties instanceof DomainError) {
    return undefined;
  }

  return properties;
});

const onUpdateValue = (propertyId: DatabasePropertyId, value: unknown) => {
  itemState.value[propertyId] = value;
};
</script>

<template>
  <MDDialog
    v-model:show="show"
    :headline="headline"
    :supporting-text="supportingText"
    :apply-label="applyLabel"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <template
      v-for="[propertyId, property] in strictRecordIterableEntries(
        properties,
      )()"
      :key="propertyId"
    >
      <slot
        name="valueField"
        :property="property"
        :value="itemState[propertyId]"
        :property-id="propertyId"
        :update="(value: unknown) => onUpdateValue(propertyId, value)"
      />
    </template>
  </MDDialog>
</template>

<style lang="css" scoped>
.db-item-add-dialog {
  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
