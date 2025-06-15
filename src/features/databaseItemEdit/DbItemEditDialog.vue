<script setup lang="ts">
import { zodBooleanProperty } from '@entity/booleanProperty';
import { zodStringProperty } from '@entity/stringProperty';
import type { PropertiesMap } from '@shared/lib/databaseDocument/state/v1/property';
import { MDDialog } from '@shared/ui/Dialog';
import { ref, watchEffect } from 'vue';
import StringPropertyField from './StringPropertyField.vue';
import { zodIs } from '@shared/lib/validateZodScheme';
import BooleanPropertyField from './BooleanPropertyField.vue';
import NumberPropertyField from './NumberPropertyField.vue';
import { zodNumberProperty } from '@entity/numberProperty';
import { zodDateProperty } from '@entity/dateProperty';
import DatePropertyField from './DatePropertyField.vue';
import type { DatabaseItem } from '@shared/lib/databaseDocument/state';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';

const { applyLabel, headline, item, properties, supportingText } = withDefaults(
  defineProps<{
    properties: PropertiesMap;
    item?: DatabaseItem;
    headline?: string;
    supportingText?: string;
    applyLabel?: string;
  }>(),
  {
    headline: 'Edit item',
    supportingText: 'Fill in the item properties.',
    applyLabel: 'Apply',
  },
);

const emit = defineEmits<{
  apply: [item: DatabaseItem];
  cancel: [];
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
    <template
      v-for="[propertyId, property] in propertiesCollection"
      :key="propertyId"
    >
      <StringPropertyField
        v-if="zodIs(property, zodStringProperty)"
        v-model:model-value="itemState[propertyId]"
        :property
      />

      <NumberPropertyField
        v-else-if="zodIs(property, zodNumberProperty)"
        v-model:model-value="itemState[propertyId]"
        :property
      />

      <BooleanPropertyField
        v-else-if="zodIs(property, zodBooleanProperty)"
        v-model:model-value="itemState[propertyId]"
        :property
      />

      <DatePropertyField
        v-else-if="zodIs(property, zodDateProperty)"
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
