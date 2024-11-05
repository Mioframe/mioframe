<script setup lang="ts">
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

    <div class="field button-grid">
      <slot name="actions" />
    </div>
  </form>
</template>
