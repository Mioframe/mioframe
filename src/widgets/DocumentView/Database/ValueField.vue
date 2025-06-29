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
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import { MDCheckbox } from '@shared/ui/Checkbox';

const {} = defineProps<{
  property: DatabaseUnknownProperty;
  value: unknown;
  directory: DirectoryFSEntry;
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
    :property
    @update:model-value="onUpdateValue"
  />

  <NumberValueField
    v-else-if="zodIs(property, zodNumberProperty)"
    :model-value="value"
    :property
    @update:model-value="onUpdateValue"
  />

  <BooleanValueField
    v-else-if="zodIs(property, zodBooleanProperty)"
    :model-value="value"
    :property
    @update:model-value="onUpdateValue"
  />

  <DateValueField
    v-else-if="zodIs(property, zodDateProperty)"
    :model-value="value"
    :property
    @update:model-value="onUpdateValue"
  />

  <RelationValueField
    v-if="zodIs(property, zodRelationProperty)"
    :value="value"
    :property
    :directory
    @update:value="onUpdateValue"
  >
    <template #data="{ docHandle, onSelect, value: selectedValue, viewId }">
      <DatabaseViewLayout :doc-handle :view-id>
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
