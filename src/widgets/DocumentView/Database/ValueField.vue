<script setup lang="ts">
import { zodBooleanProperty } from '@entity/databaseBoolean';
import { zodDateProperty } from '@entity/databaseDate';
import { zodNumberProperty } from '@entity/databaseNumber';
import { zodRelationProperty } from '@entity/databaseRelation';
import { zodStringProperty } from '@entity/databaseString';
import { BooleanValueField } from '@feature/booleanValueEdit';
import { DateValueField } from '@feature/dateValueEdit';
import { NumberValueField } from '@feature/numberValueEdit';
import { RelationValueField } from '@feature/relationValueEdit';
import { StringValueField } from '@feature/stringValueEdit';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import { MDCheckbox } from '@shared/ui/Checkbox';
import type { ClassValue } from 'vue';
import { toRefs } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDatabaseProperty } from '@entity/databaseProperty';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
  value: unknown;
  class?: ClassValue;
  autofocus?: boolean;
}>();

const {
  directoryPath: path,
  documentId,
  propertyId,
  class: propClass,
} = toRefs(props);

const emit = defineEmits<{
  'update:value': [v: unknown];
  'update:property': [v: DatabaseUnknownProperty];
  keydown: [e: KeyboardEvent];
}>();

defineSlots<{
  unknownProperty: () => unknown;
}>();

const { property } = useDatabaseProperty(path, documentId, propertyId);

const onUpdateValue = (v: unknown) => {
  emit('update:value', v);
};

const onUpdateProperty = (v: DatabaseUnknownProperty) => {
  emit('update:property', v);
};
</script>

<template>
  <StringValueField
    v-if="zodIs(property, zodStringProperty)"
    :model-value="value"
    :property="property"
    :class="propClass"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
    @keydown="emit('keydown', $event)"
  />

  <NumberValueField
    v-else-if="zodIs(property, zodNumberProperty)"
    :class="propClass"
    :model-value="value"
    :property="property"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
    @keydown="emit('keydown', $event)"
  />

  <BooleanValueField
    v-else-if="zodIs(property, zodBooleanProperty)"
    :class="propClass"
    :model-value="value"
    :property="property"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
  />

  <DateValueField
    v-else-if="zodIs(property, zodDateProperty)"
    :class="propClass"
    :model-value="value"
    :property="property"
    :autofocus="autofocus"
    @update:model-value="onUpdateValue"
    @keydown="emit('keydown', $event)"
  />

  <RelationValueField
    v-else-if="zodIs(property, zodRelationProperty)"
    :class="propClass"
    :value="value"
    :directory-path="path"
    :property="property"
    :autofocus="autofocus"
    @update:value="onUpdateValue"
    @update:property="onUpdateProperty"
  >
    <template
      #data="{
        documentId: relationDocHandle,
        onSelect,
        value: selectedValue,
        viewId,
      }"
    >
      <DatabaseViewLayout
        :document-id="relationDocHandle"
        :view-id="viewId"
        :path="path"
      >
        <template #action="{ itemId }">
          <MDCheckbox
            :model-value="selectedValue.includes(itemId)"
            @update:model-value="onSelect(itemId)"
          />
        </template>
      </DatabaseViewLayout>
    </template>
  </RelationValueField>

  <slot v-else name="unknownProperty">
    <div :class="propClass">
      There is no suitable input field for property "{{ property?.name }}"
    </div>
  </slot>
</template>
