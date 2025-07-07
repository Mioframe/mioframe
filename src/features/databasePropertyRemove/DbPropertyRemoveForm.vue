<script setup lang="ts">
import { ref, toRefs } from 'vue';
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument/migrations/versions';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import type { AMDocHandle } from '@shared/lib/automerge';

const emit = defineEmits<{
  remove: [propertyId: DatabasePropertyId];
  canceled: [];
}>();

const props = defineProps<{
  docHandle: AMDocHandle;
}>();

const { docHandle } = toRefs(props);

const databaseProperties = useDatabasePropertiesMap(docHandle);

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
            v-for="[id, property] in databaseProperties.entries"
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
