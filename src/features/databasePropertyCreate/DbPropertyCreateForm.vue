<script setup lang="ts">
import { ref } from 'vue';
import { type PropertyId } from '../../shared/lib/databaseDocument';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { createDatabaseDocument } from '../../shared/lib/databaseDocument/createDatabaseDocument';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import type { ValueOf } from 'type-fest/source/value-of';
import { PROPERTY_TYPE_NUMBER } from '@entity/numberProperty/number';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/booleanProperty/boolean';
import { PROPERTY_TYPE_DATE } from '@entity/dateProperty/date';
import { UIButton } from '@shared/ui/Button';

const stateName = ref<string>();

const propertyTypeList = {
  PROPERTY_TYPE_STRING,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_DATE,
} as const;

type PropertyType = ValueOf<typeof propertyTypeList>;

const stateType = ref<PropertyType>();

const emit = defineEmits<{
  created: [propertyId: PropertyId];
  canceled: [];
}>();

const props = defineProps<{
  cfrDocument: CFRDocument;
}>();

const onSubmit = () => {
  if (stateName.value?.length && stateType.value) {
    const { addProperty } = createDatabaseDocument(props.cfrDocument);

    const propertyId = addProperty({
      name: stateName.value,
      type: stateType.value,
    });

    emit('created', propertyId);
  }
};

const onClickCancel = () => {
  stateName.value = undefined;
  stateType.value = undefined;
  emit('canceled');
};
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <div class="field">
      <label class="label">Property name</label>

      <div class="control">
        <input
          v-model="stateName"
          class="input"
          type="text"
          placeholder="name"
        />
      </div>
    </div>

    <div class="field">
      <label class="label">Property type</label>

      <div class="select">
        <select v-model="stateType">
          <option disabled />

          <option v-for="propertyType in propertyTypeList" :key="propertyType">
            {{ propertyType }}
          </option>
        </select>
      </div>
    </div>

    <div class="button-grid">
      <UIButton type="submit" primary>Create</UIButton>

      <UIButton @click="onClickCancel"> Cancel </UIButton>
    </div>
  </form>
</template>
