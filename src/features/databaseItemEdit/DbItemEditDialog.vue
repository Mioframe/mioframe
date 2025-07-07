<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import type {
  DatabaseItem,
  DatabasePropertyId,
  GeneralProperty,
  PropertiesMap,
} from '@shared/lib/databaseDocument';

const {
  applyLabel = 'Apply',
  headline = 'Edit item',
  item,
  properties,
  supportingText = 'Fill in the item properties.',
} = defineProps<{
  properties: PropertiesMap;
  item?: DatabaseItem;
  headline?: string;
  supportingText?: string;
  applyLabel?: string;
}>();

const emit = defineEmits<{
  apply: [item: DatabaseItem];
  cancel: [];
}>();

defineSlots<{
  valueField(p: {
    property: GeneralProperty;
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const itemState = ref<DatabaseItem>({});

watchEffect(() => {
  itemState.value = item ?? {};
});

const onApply = () => {
  emit('apply', itemState.value);
};

const onCancel = () => {
  itemState.value = {};
  emit('cancel');
};

const propertiesCollection = useWrapStrictRecord(() => properties);

const onUpdateValue = (propertyId: DatabasePropertyId, value: unknown) => {
  itemState.value[propertyId] = value;
};
</script>

<template>
  <MDDialog
    :headline="headline"
    :supporting-text="supportingText"
    :apply-label="applyLabel"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <template
      v-for="[propertyId, property] in propertiesCollection?.entries"
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
