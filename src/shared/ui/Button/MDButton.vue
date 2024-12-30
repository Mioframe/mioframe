<script setup lang="ts">
import { vPressedState } from '@shared/lib/md/stateHelper';
import { toRef } from 'vue';

const props = defineProps<{
  formAction?: 'submit' | 'reset';
  type?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text';
  label?: string;
  disabled?: boolean;
  pressed?: boolean;
  focused?: boolean;
}>();

defineSlots<{
  icon(): unknown;
}>();

const buttonType = toRef(() => props.type ?? 'outlined');
</script>

<template>
  <button
    v-pressed-state
    :disabled="disabled"
    :type="formAction ?? 'button'"
    class="md-button"
    :class="[
      `md-button_${buttonType}`,
      {
        'md-button_pressed': pressed,
        'md-button_focused': focused,
        'md-button_icon': !!$slots.icon,
      },
    ]"
  >
    <span v-if="!!$slots.icon" class="md-button__icon"
      ><slot name="icon"
    /></span>

    <span v-if="label" class="md-button__label-text">{{ label }}</span>
  </button>
</template>

<style lang="scss" scoped>
@use '../../lib/md';

.md-button {
  @include md.md-state;
  transition-property: box-shadow, color, background-color, padding;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: md.dp(20);
  height: md.dp(40);
  padding-left: md.dp(25);
  padding-right: md.dp(25);
  font-family: var(--md-sys-typescale-label-large-font);
  line-height: var(--md-sys-typescale-label-large-line-height);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  --md-button-icon-size: md.dp(18);

  &__icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--md-button-icon-size, 1lh);
    height: var(--md-button-icon-size, 1lh);
    color: var(--md-button-icon-color, inherit);
  }

  &__label-text {
    white-space: nowrap;
  }

  &_icon {
    padding-left: md.dp(16);
    gap: md.dp(8);
  }

  &_elevated {
    --md-container-color: var(--md-sys-color-surface-container-low);
    --md-content-color: var(--md-sys-color-primary);
    @include md.elevateToShadow(1);

    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.12
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      @include md.elevateToShadow(0);
    }

    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      @include md.elevateToShadow(2);
    }

    &:focus-visible,
    &.md-button_focused {
    }
  }

  &_filled {
    --md-container-color: var(--md-sys-color-primary);
    --md-content-color: var(--md-sys-color-on-primary);
    --md-button-icon-color: var(--md-sys-color-on-primary);
    @include md.elevateToShadow(0);

    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.12
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &:hover {
      --md-content-color: var(--md-sys-color-on-primary);
      --md-button-icon-color: var(--md-sys-color-on-primary);
      @include md.elevateToShadow(1);
    }

    &:focus-visible,
    &.md-button_focused {
      --md-content-color: var(--md-sys-color-on-primary);
      --md-button-icon-color: var(--md-sys-color-on-primary);
      @include md.elevateToShadow(0);
    }
  }

  &_tonal {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    @include md.elevateToShadow(0);

    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.12
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &:hover {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
      @include md.elevateToShadow(1);
    }

    &:focus-visible,
    &.md-button_focused {
      @include md.elevateToShadow(0);
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    }
  }

  &_outlined {
    border-style: solid;
    border-color: var(--md-sys-color-outline);
    border-width: md.dp(1);
    box-sizing: border-box;
    --md-content-color: var(--md-sys-color-primary);
    @include md.elevateToShadow(0);
    --md-button-icon-color: var(--md-sys-color-primary);

    &:disabled {
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
      outline-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
    }

    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      --button-icon-color: var(--md-sys-color-primary);
      outline-color: var(--md-sys-color-outline);
    }

    &:focus-visible,
    &.md-button_focused {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    }
  }

  &_text {
    --md-content-color: var(--md-sys-color-primary);
    --md-button-icon-color: var(--md-sys-color-primary);
    padding-left: md.dp(12);
    padding-right: md.dp(12);
    @include md.elevateToShadow(0);

    &.md-button_icon {
      padding-right: md.dp(16);
    }

    &:disabled {
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      --md-button-icon-color: var(--md-sys-color-primary);
    }

    &:focus-visible,
    &.md-button_focused {
      --md-content-color: var(--md-sys-color-primary);
      --md-button-icon-color: var(--md-sys-color-primary);
    }
  }
}
</style>
