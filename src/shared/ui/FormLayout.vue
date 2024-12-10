<script setup lang="ts">
import { ButtonGrid } from './ButtonGrid';

defineEmits<{
  submit: [];
}>();

defineSlots<{
  default(): unknown;
  actions(): unknown;
}>();
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="$emit('submit')"
  >
    <slot />

    <ButtonGrid class="field">
      <slot name="actions" />
    </ButtonGrid>
  </form>
</template>
