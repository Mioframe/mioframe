<script setup lang="ts">
import { zodBooleanProperty } from '@entity/booleanProperty';
import { zodStringProperty } from '@entity/stringProperty';
import type {
  PropertiesMap,
  PropertyId,
} from '@shared/lib/databaseDocument/state/v1/property';
import { MDDialog } from '@shared/ui/Dialog';
import { ref, watchEffect } from 'vue';
import StringPropertyField from './StringPropertyField.vue';
import { is } from '@shared/lib/validateZodScheme';
import BooleanPropertyField from './BooleanPropertyField.vue';
import NumberPropertyField from './NumberPropertyField.vue';
import { zodNumberProperty } from '@entity/numberProperty';
import { zodDateProperty } from '@entity/dateProperty';
import DatePropertyField from './DatePropertyField.vue';
import type { DatabaseItem } from '@shared/lib/databaseDocument/state';

const {
  properties,
  item = {},
  headline = 'Edit item',
  supportingText = 'Fill in the item properties.',
  applyLabel = 'Apply',
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

const itemState = ref<{ [K: PropertyId]: unknown }>({});

watchEffect(() => {
  itemState.value = item;
});

const onApply = () => {
  emit('apply', itemState.value);
};

const onCancel = () => {
  itemState.value = {};
  emit('cancel');
};
</script>

<template>
  <MDDialog
    :headline
    :supporting-text
    :apply-label
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <template v-for="(property, propertyId) in properties" :key="propertyId">
      <StringPropertyField
        v-if="is(property, zodStringProperty)"
        v-model:model-value="itemState[propertyId]"
        :property
      />

      <NumberPropertyField
        v-else-if="is(property, zodNumberProperty)"
        v-model:model-value="itemState[propertyId]"
        :property
      />

      <BooleanPropertyField
        v-else-if="is(property, zodBooleanProperty)"
        v-model:model-value="itemState[propertyId]"
        :property
      />

      <DatePropertyField
        v-else-if="is(property, zodDateProperty)"
        v-model:model-value="itemState[propertyId]"
        :property
      />

      <div v-else>
        don't have a field for property "{{ property.name }}" with type "{{
          property.type
        }}"
      </div>
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
