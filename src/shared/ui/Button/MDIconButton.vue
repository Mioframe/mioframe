<script setup lang="ts">
import { vPressedState } from '@shared/lib/md/stateHelper';
import { toRef } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { isNumber } from 'lodash-es';
import { vMdTooltip } from '../Tooltips';

const props = defineProps<{
  formAction?: 'submit' | 'reset';
  type?: 'filled' | 'filled-tonal' | 'outlined' | 'standard';
  disabled?: boolean;
  pressed?: boolean;
  focused?: boolean;
  loading?: number | boolean;
  tooltip: string;
}>();

defineSlots<{
  icon(): unknown;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonType = toRef(() => props.type ?? 'standard');
</script>

<template>
  <button
    v-pressed-state
    v-md-tooltip="tooltip"
    :disabled="disabled"
    :type="formAction ?? 'button'"
    class="md-icon-button md-state"
    :class="[
      `md-icon-button_${buttonType}`,
      {
        'md-icon-button_pressed': pressed,
        'md-icon-button_focused': focused,
        'md-icon-button_icon': !!$slots.icon,
        'md-icon-button_loading': loading,
      },
    ]"
    @click="$emit('click', $event)"
  >
    <MDCircularProgressIndicator
      v-if="loading"
      class="md-icon-button__progress-indicator"
      :progress="isNumber(loading) ? loading : undefined"
    />

    <span v-else-if="!!$slots.icon" class="md-icon-button__icon">
      <slot name="icon" />
    </span>
  </button>
</template>

<style scoped>
.md-icon-button {
  --md-icon-button-size: 40px;
  --md-icon-button-icon-size: 24px;

  /* position: relative; */
  transition-property: box-shadow, color, background-color, padding;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  height: var(--md-icon-button-size);
  width: var(--md-icon-button-size);
  border-radius: calc(var(--md-icon-button-size) / 2);
  font-family: var(--md-sys-typescale-label-large-font);
  line-height: var(--md-sys-typescale-label-large-line-height);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);

  &__icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--md-icon-button-icon-size, 1lh);
    height: var(--md-icon-button-icon-size, 1lh);
    color: var(--md-icon-button-icon-color, inherit);
    transition-property: opacity;
    transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

    .md-icon-button_loading & {
      opacity: 0;
    }
  }

  &__progress-indicator {
    position: absolute;
    width: 24px;
    height: 24px;
  }

  &_filled {
    --md-container-color: var(--md-sys-color-primary);
    --md-content-color: var(--md-sys-color-on-primary);
    --md-icon-button-icon-color: var(--md-sys-color-on-primary);

    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.12
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-icon-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &:hover {
      --md-content-color: var(--md-sys-color-on-primary);
      --md-icon-button-icon-color: var(--md-sys-color-on-primary);
    }

    &:focus-visible,
    &.md-icon-button_focused {
      --md-content-color: var(--md-sys-color-on-primary);
      --md-icon-button-icon-color: var(--md-sys-color-on-primary);
    }
  }

  &_filled-tonal {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-icon-button-icon-color: var(--md-sys-color-on-secondary-container);

    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.12
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-icon-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &:hover {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-icon-button-icon-color: var(--md-sys-color-on-secondary-container);
    }

    &:focus-visible,
    &.md-icon-button_focused {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-icon-button-icon-color: var(--md-sys-color-on-secondary-container);
    }
  }

  &_outlined {
    border-style: solid;
    border-color: var(--md-sys-color-outline);
    border-width: 1px;
    box-sizing: border-box;
    --md-content-color: var(--md-sys-color-on-surface-variant);
    --md-icon-button-icon-color: var(--md-content-color);

    &:disabled {
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-icon-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
      outline-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
    }

    &:focus-visible,
    &.md-icon-button_focused {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-icon-button-icon-color: var(--md-sys-color-on-secondary-container);
    }
  }

  &_standard {
    --md-content-color: var(--md-sys-color-on-surface-variant);
    --md-icon-button-icon-color: var(--md-content-color);

    &:disabled {
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-icon-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &:focus-visible,
    &.md-icon-button_focused {
      --md-content-color: var(--md-sys-color-primary);
      --md-icon-button-icon-color: var(--md-sys-color-primary);
    }
  }
}
</style>
