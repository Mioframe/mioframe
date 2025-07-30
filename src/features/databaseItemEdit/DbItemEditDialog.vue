<script setup lang="ts">
import { computed, ref, toRefs, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import {
  useDatabaseData,
  type DatabaseItem,
  type DatabaseItemId,
  type DatabasePropertyId,
  type GeneralProperty,
} from '@shared/lib/databaseDocument';
import type { AMDocHandle } from '@shared/lib/automerge';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';

const props = withDefaults(
  defineProps<{
    docHandle: AMDocHandle;
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

const { applyLabel, headline, supportingText, itemId, docHandle } =
  toRefs(props);

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

const databaseData = useDatabaseData(docHandle);

const currentItemState = computed(() =>
  itemId.value ? databaseData.getItem(itemId.value) : undefined,
);

watchEffect(() => {
  itemState.value = currentItemState.value ?? {};
});

const onApply = async () => {
  if (itemId.value) {
    await databaseData.setItem(itemId.value, itemState.value);
    emit('updated', itemState.value);
  } else {
    const id = await databaseData.createItem(itemState.value);
    emit('created', id);
  }
};

const onCancel = () => {
  itemState.value = {};
  emit('cancel');
};

const propertyMap = useDatabasePropertiesMap(docHandle);

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
      v-for="[propertyId, property] in propertyMap.entries"
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
