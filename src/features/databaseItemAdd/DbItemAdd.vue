<script
  setup
  lang="ts"
  generic="T, GP extends GeneralProperty<T>, PM extends PropertiesMap<GP>"
>
import type { PropertiesMap } from '@/shared/lib/databaseDocument/property/property';
import type { GeneralProperty } from '@/shared/lib/databaseDocument/property/general';
import FormLayout from '@shared/ui/FormLayout.vue';
import UIButton from '@shared/ui/Button/UIButton.vue';

defineProps<{
  properties: PM;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const onSubmit = () => {
  emit('submit');
};

const onClickCancel = () => {
  emit('cancel');
};

defineSlots<{
  property: (props: {
    propertyId: keyof PM;
    property: PM[keyof PM];
  }) => unknown;
}>();
</script>

<template>
  <FormLayout @submit="onSubmit">
    <template v-for="(property, propertyId) in properties">
      <slot name="property" :property :property-id />
    </template>

    <template #actions>
      <UIButton type="submit" primary>Add</UIButton>

      <UIButton @click="onClickCancel"> Cancel </UIButton>
    </template>
  </FormLayout>
</template>
