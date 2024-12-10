<script setup lang="ts">
import { ref } from 'vue';
import { type PropertyId } from '../../shared/lib/databaseDocument';
import { UIButton } from '@shared/ui/Button';
import type { PropertiesMap } from '@shared/lib/databaseDocument/property';
import FormLayout from '@shared/ui/FormLayout.vue';

const emit = defineEmits<{
  remove: [propertyId: PropertyId];
  canceled: [];
}>();

defineProps<{
  properties: PropertiesMap;
}>();

const selectedPropertyId = ref<PropertyId>();

const onSubmit = () => {
  const propertyId = selectedPropertyId.value;
  if (propertyId) {
    emit('remove', propertyId);
  }
};

const onClickCancel = () => {
  selectedPropertyId.value = undefined;
  emit('canceled');
};
</script>

<template>
  <FormLayout @submit="onSubmit">
    <div class="field">
      <label class="label">Property to be removed</label>

      <div class="select">
        <select v-model="selectedPropertyId">
          <option disabled />

          <option v-for="(property, id) in properties" :key="id" :value="id">
            {{ property.name }}
          </option>
        </select>
      </div>
    </div>

    <template #actions>
      <UIButton type="submit" danger> Remove </UIButton>

      <UIButton @click="onClickCancel"> Cancel </UIButton>
    </template>
  </FormLayout>
</template>
