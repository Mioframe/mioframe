<script setup lang="ts">
import { BooleanValueField, zodBooleanProperty } from '@entity/databaseBoolean';
import { DateValueField, zodDateProperty } from '@entity/databaseDate';
import { NumberValueField, zodNumberProperty } from '@entity/databaseNumber';
import { StringValueField, zodStringProperty } from '@entity/databaseString';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';

const {} = defineProps<{
  property: DatabaseUnknownProperty;
  value: unknown;
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

  <div v-else>
    don't have a field for property "{{ property.name }}" with type "{{
      property.type
    }}"
  </div>
</template>
