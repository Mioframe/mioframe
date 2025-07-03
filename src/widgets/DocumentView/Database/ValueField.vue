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
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import { MDCheckbox } from '@shared/ui/Checkbox';
import type { AMDocHandle } from '@shared/lib/automerge';

defineProps<{
  property: DatabaseUnknownProperty;
  value: unknown;
  directory: DirectoryFSEntry;
  propertyId: DatabasePropertyId;
  docHandle: AMDocHandle;
}>();

const emit = defineEmits<{
  'update:value': [v: unknown];
}>();

const onUpdateValue = (v: unknown) => {
  emit('update:value', v);
};
</script>

<template>
  <StringValueField
    v-if="zodIs(property, zodStringProperty)"
    :model-value="value"
    :property="property"
    @update:model-value="onUpdateValue"
  />

  <NumberValueField
    v-else-if="zodIs(property, zodNumberProperty)"
    :model-value="value"
    :property="property"
    @update:model-value="onUpdateValue"
  />

  <BooleanValueField
    v-else-if="zodIs(property, zodBooleanProperty)"
    :model-value="value"
    :property="property"
    @update:model-value="onUpdateValue"
  />

  <DateValueField
    v-else-if="zodIs(property, zodDateProperty)"
    :model-value="value"
    :property="property"
    @update:model-value="onUpdateValue"
  />

  <RelationValueField
    v-else-if="zodIs(property, zodRelationProperty)"
    :value="value"
    :property="property"
    :directory="directory"
    :property-id="propertyId"
    :doc-handle="docHandle"
    @update:value="onUpdateValue"
  >
    <template
      #data="{
        docHandle: relationDocHandle,
        onSelect,
        value: selectedValue,
        viewId,
      }"
    >
      <DatabaseViewLayout :doc-handle="relationDocHandle" :view-id="viewId">
        <template #action="{ itemId }">
          <MDCheckbox
            :model-value="selectedValue.includes(itemId)"
            @update:model-value="onSelect(itemId)"
          />
        </template>
      </DatabaseViewLayout>
    </template>
  </RelationValueField>

  <div v-else>
    don't have a field for property "{{ property.name }}" with type "{{
      property.type
    }}"
  </div>
</template>
