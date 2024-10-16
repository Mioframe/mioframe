<script
  setup
  lang="ts"
  generic="
    T extends string,
    GP extends GeneralProperty<T>,
    PM extends PropertiesMap<GP>
  "
>
import type { PropertiesMap } from '@/shared/lib/databaseDocument/property/property';
import type { GeneralProperty } from '@/shared/lib/databaseDocument/property/general';

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
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <template v-for="(property, propertyId) in properties">
      <slot name="property" :property="property" :property-id />
    </template>

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit">Add</button>
      </div>

      <div class="control">
        <button class="button" type="button" @click="onClickCancel">
          Cancel
        </button>
      </div>
    </div>
  </form>
</template>
