<script setup lang="ts">
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { isNumber } from 'remeda';
import { MDState } from '../State';

const {
  color = 'filled',
  formAction = 'button',
  type = 'default',
  size = 'small',
  shape = 'round',
} = defineProps<{
  formAction?: 'submit' | 'reset' | 'button';
  color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text';
  label?: string;
  disabled?: boolean;
  loading?: number | boolean;
  type?: 'default' | 'toggle';
  size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
  shape?: 'round' | 'square';
  selected?: boolean;
}>();

defineSlots<{
  icon(): unknown;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <MDState
    tag="button"
    :disabled="disabled"
    :type="formAction"
    class="md-button"
    :class="[
      `md-button_color-${color}`,
      `md-button_type-${type}`,
      `md-button_size-${size}`,
      `md-button_shape-${shape}`,
      {
        'md-button_icon': !!$slots.icon,
        'md-button_loading': loading,
        'md-button_selected': selected,
      },
    ]"
    @click.stop="$emit('click', $event)"
  >
    <div class="md-button__content">
      <span v-if="!!$slots.icon" class="md-button__icon">
        <slot name="icon" />
      </span>

      <span v-if="label" class="md-button__label-text">{{ label }}</span>

      <MDCircularProgressIndicator
        v-if="loading"
        class="md-button__progress-indicator"
        :progress="isNumber(loading) ? loading : undefined"
      />
    </div>
  </MDState>
</template>

<style scoped>
.md-button {
  --md-button-border-radius: 20px;
  --md-button-icon-size: 18px;
  --md-button-height: 40px;
  --md-button-padding: 16px;
  --md-button-icon-gap: 8px;
  --md-target-width: max(48px, 100%);
  --md-target-height: max(48px, 100%);

  transition-property:
    box-shadow, color, background-color, padding, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--md-button-border-radius);
  height: var(--md-button-height);
  padding-left: var(--md-button-padding);
  padding-right: var(--md-button-padding);
  font-family: var(--md-sys-typescale-label-large-font);
  line-height: var(--md-sys-typescale-label-large-line-height);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);

  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    --md-container-color: transparent;
    gap: var(--md-button-icon-gap);
  }

  &__icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--md-button-icon-size, 1lh);
    height: var(--md-button-icon-size, 1lh);
    color: var(--md-button-icon-color, inherit);
    transition-property: opacity;
    transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
    --md-container-color: transparent;

    .md-button_loading & {
      opacity: 0;
    }
  }

  &__label-text {
    white-space: nowrap;
    transition-property: opacity;
    transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
    background: none;

    .md-button_loading & {
      opacity: 0;
    }
  }

  &__progress-indicator {
    position: absolute;
    width: 24px;
    height: 24px;
  }

  &.md-button_shape-round {
    --md-button-border-radius: var(--md-button-height);
  }

  &.md-button_color-elevated {
    --md-container-color: var(--md-sys-color-surface-container-low);
    --md-content-color: var(--md-sys-color-primary);
    box-shadow: var(--md-sys-elevation-level1);

    &.md-button_type-toggle {
      --md-container-color: var(--md-sys-color-surface-container-low);
      --md-content-color: var(--md-sys-color-primary);

      &.md-button_selected {
        --md-container-color: var(--md-sys-color-primary);
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.1
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      box-shadow: var(--md-sys-elevation-level0);
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      box-shadow: var(--md-sys-elevation-level2);

      &.md-button_selected {
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_focused,
    &:focus-visible {
      --md-content-color: var(--md-sys-color-primary);
      box-shadow: var(--md-sys-elevation-level1);

      &.md-button_selected {
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }
  }

  &.md-button_color-filled {
    --md-container-color: var(--md-sys-color-primary);
    --md-content-color: var(--md-sys-color-on-primary);
    --md-button-icon-color: var(--md-sys-color-on-primary);
    box-shadow: var(--md-sys-elevation-level0);

    &.md-button_type-toggle {
      --md-container-color: var(--md-sys-color-surface-container);
      --md-content-color: var(--md-sys-color-on-surface-variant);

      &.md-button_selected {
        --md-container-color: var(--md-sys-color-primary);
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.1
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &.md-state_hover,
    &:hover {
      box-shadow: var(--md-sys-elevation-level1);
    }
  }

  &.md-button_color-tonal {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    box-shadow: var(--md-sys-elevation-level0);

    &.md-button_type-toggle {
      &.md-button_selected {
        --md-container-color: var(--md-sys-color-secondary);
        --md-content-color: var(--md-sys-color-on-secondary);
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.1
      );
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
      box-shadow: var(--md-sys-elevation-level1);
    }

    &:focus-visible,
    &.md-state_focused {
      box-shadow: var(--md-sys-elevation-level0);
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    }
  }

  &.md-button_color-outlined {
    border-style: solid;
    border-color: var(--md-sys-color-outline-variant);
    border-width: 1px;
    box-sizing: border-box;
    --md-content-color: var(--md-sys-color-on-surface-variant);
    box-shadow: var(--md-sys-elevation-level0);

    &.md-button_type-toggle {
      &.md-button_selected {
        --md-container-color: var(--md-sys-color-inverse-surface);
        --md-content-color: var(--md-sys-color-inverse-on-surface);
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
      outline-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      --button-icon-color: var(--md-sys-color-primary);
      outline-color: var(--md-sys-color-outline);
    }

    &:focus-visible,
    &.md-state_focused {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    }
  }

  &.md-button_color-text {
    --md-content-color: var(--md-sys-color-primary);
    padding-left: 12px;
    padding-right: 12px;
    box-shadow: var(--md-sys-elevation-level0);

    &.md-button_icon {
      padding-right: 16px;
    }

    &.md-state_disabled,
    &:disabled {
      --md-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-button-icon-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      --md-button-icon-color: var(--md-sys-color-primary);
    }

    &:focus-visible,
    &.md-state_focused {
      --md-content-color: var(--md-sys-color-primary);
      --md-button-icon-color: var(--md-sys-color-primary);
    }
  }

  &.md-button_size {
    &-extra-small {
      --md-button-height: 32px;
      --md-button-padding: 12px;
      --md-button-icon-gap: 4px;

      &.md-button_shape-square {
        --md-button-border-radius: 12px;
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: 8px;
      }
    }

    &-small {
      --md-button-height: 40px;
      --md-button-padding: 16px;
      --md-button-icon-gap: 8px;

      &.md-button_shape-square {
        --md-button-border-radius: 12px;
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: 8px;
      }
    }

    &-medium {
      --md-button-height: 56px;
      --md-button-padding: 24px;
      --md-button-icon-gap: 8px;

      &.md-button_shape-square {
        --md-button-border-radius: 16px;
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: 12px;
      }
    }

    &-large {
      --md-button-height: 96px;
      --md-button-padding: 48px;
      --md-button-icon-gap: 12px;

      &.md-button_shape-square {
        --md-button-border-radius: 28px;
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: 16px;
      }
    }

    &-extra-large {
      --md-button-height: 136px;
      --md-button-padding: 64px;
      --md-button-icon-gap: 16px;

      &.md-button_shape-square {
        --md-button-border-radius: 28px;
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: 16px;
      }
    }
  }
}
</style>
