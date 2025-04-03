<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelect } from '@shared/ui/Select';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import { PROPERTY_TYPE_NUMBER } from '@entity/numberProperty';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/booleanProperty';
import { PROPERTY_TYPE_DATE } from '@entity/dateProperty';
import type { ValueOf } from 'type-fest';
import type { UnknownProperty } from '@shared/lib/databaseDocument';

const stateName = ref<string>();

const propertyTypeList = {
  PROPERTY_TYPE_STRING,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_DATE,
} as const;

type PropertyType = ValueOf<typeof propertyTypeList>;

const selectedType = ref<{ labelText: PropertyType }[]>([
  { labelText: propertyTypeList.PROPERTY_TYPE_STRING },
]);

const stateType = computed(() => selectedType.value.at(0)?.labelText);

const emit = defineEmits<{
  create: [property: UnknownProperty];
  cancel: [];
}>();

const propertyTypeOptions = Object.entries(propertyTypeList).reduce<
  {
    labelText: PropertyType;
  }[]
>((acc, [, value]) => {
  acc.push({
    labelText: value,
  });
  return acc;
}, []);

const onCreate = () => {
  if (stateName.value?.length && stateType.value) {
    emit('create', {
      name: stateName.value,
      type: stateType.value,
    });
  }
};

const onCancel = () => {
  stateName.value = undefined;
  selectedType.value = [];
  emit('cancel');
};
</script>

<template>
  <MDDialog
    headline="Create Property"
    supporting-text="Enter a name and select the type of the new property."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onCreate"
    @cancel="onCancel"
  >
    <MDTextField
      v-model:model-value="stateName"
      label-text="Name"
      class="database-property-creation__field"
    />

    <MDSelect
      v-model:model-value="selectedType"
      class="database-property-creation__field"
      label-text="Property type"
      :options="propertyTypeOptions"
    />
  </MDDialog>
</template>
