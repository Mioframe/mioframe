<script setup lang="ts">
import { ref } from 'vue';
import { UIButton } from '@shared/ui/Button';
import type { PropertiesMap } from '@shared/lib/databaseDocument/migrations/versions/v1/property';
import FormLayout from '@shared/ui/FormLayout.vue';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument/migrations/versions';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';

const emit = defineEmits<{
  remove: [propertyId: DatabasePropertyId];
  canceled: [];
}>();

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const propertyCollection = useWrapStrictRecord(() => properties);

const selectedPropertyId = ref<DatabasePropertyId>();

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

          <option
            v-for="[id, property] in propertyCollection"
            :key="id"
            :value="id"
          >
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
