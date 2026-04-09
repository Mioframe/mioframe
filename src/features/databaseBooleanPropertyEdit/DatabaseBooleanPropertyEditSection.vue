<script setup lang="ts">
import type { BooleanProperty } from '@entity/databaseBoolean';
import { MDCheckboxField } from '@shared/ui/Checkbox';
import { computed } from 'vue';

const propertyModel = defineModel<BooleanProperty>('property', {
  required: true,
});

const indeterminateModel = computed({
  get: () => propertyModel.value.indeterminate,
  set: (indeterminate) => (propertyModel.value = { ...propertyModel.value, indeterminate }),
});
</script>

<template>
  <section>
    <MDCheckboxField v-model="indeterminateModel" label="indeterminate" />
  </section>
</template>
