<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import {
  zodDatabaseDocumentContent,
  type PropertyId,
} from '../../shared/lib/databaseDocument';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { createDatabaseDocument } from '../../shared/lib/databaseDocument/createDatabaseDocument';
import { useCFRDocument } from '../../entities/document';
import { is } from '../../shared/lib/validateZodScheme';
import { UIButton } from '@shared/ui/Button';

const emit = defineEmits<{
  removed: [propertyId: PropertyId];
  canceled: [];
}>();

const props = defineProps<{
  cfrDocument: CFRDocument;
}>();

const selectedPropertyId = ref<PropertyId>();

const cfrDocument = toRef(() => props.cfrDocument);

const { doc } = useCFRDocument(cfrDocument);

const propertiesMap = computed(() => {
  if (is(doc.value, zodDatabaseDocumentContent)) {
    return doc.value.body.properties;
  }
  return undefined;
});

const onSubmit = () => {
  const propertyId = selectedPropertyId.value;
  if (propertyId) {
    createDatabaseDocument(props.cfrDocument).removeProperty(propertyId);

    emit('removed', propertyId);
  }
};

const onClickCancel = () => {
  selectedPropertyId.value = undefined;
  emit('canceled');
};
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <div class="field">
      <label class="label">Property to be removed</label>

      <div class="select">
        <select v-model="selectedPropertyId">
          <option disabled />

          <option v-for="(property, id) in propertiesMap" :key="id" :value="id">
            {{ property?.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="button-grid">
      <UIButton type="submit" danger> Remove </UIButton>

      <UIButton @click="onClickCancel"> Cancel </UIButton>
    </div>
  </form>
</template>
