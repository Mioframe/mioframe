<script setup lang="ts">
import { BooleanValueField, zodBooleanProperty } from '@entity/databaseBoolean';
import { DateValueField, zodDateProperty } from '@entity/databaseDate';
import { NumberValueField, zodNumberProperty } from '@entity/databaseNumber';
import { RelationValueField, zodRelationProperty } from '@entity/databaseRelation';
import { StringValueField, zodStringProperty } from '@entity/databaseString';
import { DatabaseRelationValueFieldData } from '@entity/databaseValue';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { ClassValue } from 'vue';
import ValueInline from './ValueInline.vue';

const props = withDefaults(
  defineProps<{
    value: unknown;
    property?: DatabaseUnknownProperty | undefined;
    directoryPath: string;
    class?: ClassValue;
    autofocus?: boolean;
    inputSize?: number;
  }>(),
  {
    inputSize: 0,
  },
);

const emit = defineEmits<{
  'update:value': [value: unknown];
  'update:property': [property: DatabaseUnknownProperty];
  keydown: [event: KeyboardEvent];
}>();

const onUpdateValue = (value: unknown) => {
  emit('update:value', value);
};

const onUpdateProperty = (property: DatabaseUnknownProperty) => {
  emit('update:property', property);
};

const onKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};
</script>

<template>
  <div v-if="!property" :class="props.class">
    There is no suitable input field for this property
  </div>

  <StringValueField
    v-else-if="zodIs(property, zodStringProperty) && props.inputSize > 0"
    :model-value="value"
    :property="property"
    :class="props.class"
    :autofocus="autofocus"
    :size="props.inputSize"
    @update:model-value="onUpdateValue"
    @keydown="onKeydown"
  />

  <StringValueField
    v-else-if="zodIs(property, zodStringProperty)"
    :model-value="value"
    :property="property"
    :class="props.class"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
    @keydown="onKeydown"
  />

  <NumberValueField
    v-else-if="zodIs(property, zodNumberProperty)"
    :model-value="value"
    :property="property"
    :class="props.class"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
    @keydown="onKeydown"
  />

  <BooleanValueField
    v-else-if="zodIs(property, zodBooleanProperty)"
    :model-value="value"
    :property="property"
    :class="props.class"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
  />

  <DateValueField
    v-else-if="zodIs(property, zodDateProperty)"
    :model-value="value"
    :property="property"
    :class="props.class"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
    @keydown="onKeydown"
  />

  <RelationValueField
    v-else-if="zodIs(property, zodRelationProperty)"
    :value="value"
    :directory-path="directoryPath"
    :property="property"
    :autofocus="autofocus"
    @update:value="onUpdateValue"
    @update:property="onUpdateProperty"
  >
    <template #data="{ documentId: relationDocHandle, onSelect, value: selectedValue, viewId }">
      <DatabaseRelationValueFieldData
        :directory-path="directoryPath"
        :document-id="relationDocHandle"
        :selected-value="selectedValue"
        :view-id="viewId"
        :on-select="onSelect"
      >
        <template #value="{ itemId, propertyId: relationPropertyId }">
          <ValueInline
            :item-id="itemId"
            :document-id="relationDocHandle"
            :directory-path="directoryPath"
            :property-id="relationPropertyId"
          />
        </template>
      </DatabaseRelationValueFieldData>
    </template>
  </RelationValueField>

  <div v-else :class="props.class">
    There is no suitable input field for property "{{ property.name }}"
  </div>
</template>
