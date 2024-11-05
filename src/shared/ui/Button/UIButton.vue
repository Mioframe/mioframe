<script setup lang="ts">
defineProps<{
  label?: string;
  primary?: boolean;
  active?: boolean;
  type?: 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}>();

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
}>();
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled"
    class="button"
    :class="{
      'is-primary': primary,
      'is-active': active,
      'is-loading': loading,
      'is-danger': danger,
    }"
  >
    <span v-if="!!slots.icon" class="icon">
      <slot name="icon" />
    </span>

    <slot>
      <span v-if="label?.length">{{ label }}</span>
    </slot>
  </button>
</template>
