<script setup lang="ts">
import { ButtonGrid } from './ButtonGrid';

const emit = defineEmits<{
  submit: [];
}>();

defineSlots<{
  default(): unknown;
  actions(): unknown;
}>();

const onFormSubmit = () => {
  emit('submit');
};
</script>

<template>
  <form class="block-spacing is-flex is-flex-direction-column" @submit.prevent="onFormSubmit">
    <slot />

    <ButtonGrid class="field">
      <slot name="actions" />
    </ButtonGrid>
  </form>
</template>
