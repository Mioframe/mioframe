<script setup lang="ts">
import { computed } from 'vue';
import type { AnyProperty } from '../../shared/lib/databaseDocument';
import {
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_STRING,
  type PropertyId,
} from '../../shared/lib/databaseDocument';
import { isNil, pickBy } from 'lodash-es';
import type {
  BooleanPropertyDescription,
  NumberPropertyDescription,
  PropertiesMap,
  StringPropertyDescription,
} from '../../shared/lib/databaseDocument/property';

const props = defineProps<{
  properties: PropertiesMap;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const filteredProperties = computed(
  (): Record<PropertyId, AnyProperty> =>
    pickBy(props.properties, (v) => !isNil(v)),
);

const onSubmit = () => {
  emit('submit');
};

const onClickCancel = () => {
  emit('cancel');
};

defineSlots<{
  string: (props: {
    property: StringPropertyDescription;
    propertyId: PropertyId;
  }) => unknown;
  number: (props: {
    property: NumberPropertyDescription;
    propertyId: PropertyId;
  }) => unknown;
  boolean: (props: {
    property: BooleanPropertyDescription;
    propertyId: PropertyId;
  }) => unknown;
}>();
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <template v-for="(property, propertyId) in filteredProperties">
      <slot
        v-if="property.type === PROPERTY_TYPE_STRING"
        name="string"
        :property
        :property-id
      />

      <slot
        v-else-if="property.type === PROPERTY_TYPE_NUMBER"
        name="number"
        :property
        :property-id
      />

      <slot
        v-else-if="property.type === PROPERTY_TYPE_BOOLEAN"
        name="boolean"
        :property
        :property-id
      />
    </template>

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit">Add</button>
      </div>

      <div class="control">
        <button class="button" type="button" @click="onClickCancel">
          Cancel
        </button>
      </div>
    </div>
  </form>
</template>
