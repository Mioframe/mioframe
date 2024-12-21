<script setup lang="ts">
import { vPressedState } from '@shared/lib/md/stateHelper';

defineProps<{
  formAction?: 'submit' | 'reset';
  type: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text';
  label?: string;
  disabled?: boolean;
  pressed?: boolean;
  focused?: boolean;
}>();
</script>

<template>
  <button
    v-pressed-state
    :disabled="disabled"
    :type="formAction ?? 'button'"
    class="md-button"
    :class="[
      `_${type}`,
      {
        _pressed: pressed,
        _focused: focused,
      },
    ]"
  >
    <span v-if="label" class="label-text">{{ label }}</span>
  </button>
</template>

<style lang="scss" scoped>
@use '../../lib/md';

.md-button {
  @extend .md-container;

  &._elevated {
    --md-container-color: var(--md-sys-color-surface-container-low);
    --md-content-color: var(--md-sys-color-primary);
    border-radius: md.dp(20);
    height: md.dp(40);
    padding-left: md.dp(25);
    padding-right: md.dp(25);
    @include md.elevateToShadow(1);

    .label-text {
      font-family: var(--md-sys-typescale-label-large-font);
      line-height: var(--md-sys-typescale-label-large-line-height);
      font-size: var(--md-sys-typescale-label-large-size);
      font-weight: var(--md-sys-typescale-label-large-weight);
      letter-spacing: var(--md-sys-typescale-label-large-tracking);
    }

    &:disabled {
      --md-container-color: #{md.opacity-hex(
          var(--md-sys-color-on-surface),
          0.12
        )};
      --md-content-color: #{md.opacity-hex(var(--md-sys-color-on-surface), 0.38)};
      pointer-events: none;
      @include md.elevateToShadow(0);
    }

    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      @include md.elevateToShadow(2);
    }

    &:focus-visible,
    &._focused {
      --md-content-color: var(--md-sys-color-primary);
    }
  }
}
</style>
