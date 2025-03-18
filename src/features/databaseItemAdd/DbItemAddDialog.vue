<script setup lang="ts">
import { zodBooleanProperty } from '@entity/booleanProperty';
import { zodStringProperty } from '@entity/stringProperty';
import type {
  PropertiesMap,
  PropertyId,
} from '@shared/lib/databaseDocument/property';
import { MDDialog } from '@shared/ui/Dialog';
import { ref } from 'vue';
import StringPropertyField from './StringPropertyField.vue';
import { is } from '@shared/lib/validateZodScheme';
import BooleanPropertyField from './BooleanPropertyField.vue';
import type { Item } from '@shared/lib/databaseDocument';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const emit = defineEmits<{
  add: [item: Item];
  cancel: [];
}>();

const itemState = ref<{ [K: PropertyId]: unknown }>({});

const onApply = () => {
  emit('add', itemState.value);
};

const onCancel = () => {
  itemState.value = {};
  emit('cancel');
};
</script>

<template>
  <MDDialog
    headline="Add item"
    supporting-text="Fill in the properties of the new item."
    apply-label="Add"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <div class="db-item-add-dialog__body">
      <template v-for="(property, propertyId) in properties" :key="propertyId">
        <StringPropertyField
          v-if="is(property, zodStringProperty)"
          v-model:model-value="itemState[propertyId]"
          :property
        />

        <BooleanPropertyField
          v-else-if="is(property, zodBooleanProperty)"
          v-model:model-value="itemState[propertyId]"
        />
        <!-- TODO: добавить подпись к boolean -->
        <!-- TODO: добавить тип Number -->

        <div v-else>
          don't have a field for property "{{ property.name }}" with type "{{
            property.type
          }}"
        </div>
      </template>
    </div>
  </MDDialog>
</template>

<style lang="css" scoped>
.db-item-add-dialog {
  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
