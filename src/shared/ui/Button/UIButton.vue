<script setup lang="ts">
import { isNumber } from 'es-toolkit/compat';
import { computed } from 'vue';

const props = defineProps<{
  label?: string;
  primary?: boolean;
  active?: boolean;
  type?: 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  grow?: number | boolean;
  shadow?: boolean;
}>();

const emit = defineEmits<{
  click: [e: MouseEvent];
  pointerdown: [e: PointerEvent];
}>();

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
}>();

const growClass = computed(() =>
  isNumber(props.grow) ? `is-flex-grow-${props.grow}` : props.grow ? 'is-flex-grow-1' : undefined,
);

const onButtonPointerDown = (event: PointerEvent) => {
  emit('pointerdown', event);
};

const onButtonClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled"
    class="button"
    :class="[
      {
        'is-primary': primary,
        'is-active': active,
        'is-loading': loading,
        'is-danger': danger,
        'is-shadowless': !shadow,
      },
      growClass,
    ]"
    @pointerdown="onButtonPointerDown"
    @click="onButtonClick"
  >
    <span v-if="!!slots.icon" class="icon">
      <slot name="icon" />
    </span>

    <slot>
      <span v-if="label?.length">{{ label }}</span>
    </slot>
  </button>

  <!-- <MDButton :label type="elevated" /> -->
</template>
