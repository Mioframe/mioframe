<script setup lang="ts">
import { ref } from 'vue';
import type { UnknownProperty } from '../../shared/lib/databaseDocument';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import type { ValueOf } from 'type-fest/source/value-of';
import { PROPERTY_TYPE_NUMBER } from '@entity/numberProperty/number';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/booleanProperty/boolean';
import { PROPERTY_TYPE_DATE } from '@entity/dateProperty/date';
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';

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
  create: [property: UnknownProperty];
  canceled: [];
}>();

const onSubmit = () => {
  if (stateName.value?.length && stateType.value) {
    emit('create', {
      name: stateName.value,
      type: stateType.value,
    });
  }
};

const onClickCancel = () => {
  stateName.value = undefined;
  stateType.value = undefined;
  emit('canceled');
};

// FIXME: не работает добавление свойства.
</script>

<template>
  <FormLayout @submit="onSubmit">
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

    <template #actions>
      <UIButton type="submit" primary>Create</UIButton>

      <UIButton @click="onClickCancel"> Cancel </UIButton>
    </template>
  </FormLayout>
</template>
