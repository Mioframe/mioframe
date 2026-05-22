<script setup lang="ts">
import { isNumber } from 'es-toolkit/compat';
import { computed, useTemplateRef } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const props = withDefaults(
  defineProps<{
    formAction?: 'submit' | 'reset' | 'button' | undefined;
    color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | undefined;
    label: string;
    disabled?: boolean | undefined;
    loading?: number | boolean | undefined;
    type?: 'default' | 'toggle' | undefined;
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    shape?: 'round' | 'square' | undefined;
    selected?: boolean | undefined;
  }>(),
  {
    color: 'filled',
    formAction: 'button',
    type: 'default',
    size: 'small',
    shape: 'round',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const slots = defineSlots<{
  icon(): unknown;
}>();

const onButtonClick = (event: MouseEvent) => {
  emit('click', event);
};

const buttonEl = useTemplateRef<HTMLButtonElement>('buttonEl');
const { hover, focused, durationPressedState } = useStateLayer(buttonEl);
const showVisualState = computed(() => !props.disabled);

useRipple(computed(() => (props.disabled ? undefined : buttonEl.value)));
</script>

<template>
  <button
    ref="buttonEl"
    :aria-label="props.label"
    :disabled="props.disabled"
    :type="props.formAction"
    class="md-button"
    :class="[
      `md-button_color-${props.color}`,
      `md-button_type-${props.type}`,
      `md-button_size-${props.size}`,
      `md-button_shape-${props.shape}`,
      {
        'md-button_icon': !!$slots.icon,
        'md-button_loading': props.loading !== undefined && props.loading !== false,
        'md-button_selected': props.selected,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focused,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_disabled': props.disabled,
      },
    ]"
    @click.stop="onButtonClick"
  >
    <MDStateLayer
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :disabled="props.disabled"
    />

    <span class="md-button__content">
      <span v-if="!!slots.icon" class="md-button__icon">
        <slot name="icon" />
      </span>

      <span v-if="props.label" class="md-button__label-text">{{ props.label }}</span>

      <MDCircularProgressIndicator
        v-if="props.loading !== undefined && props.loading !== false"
        class="md-button__progress-indicator"
        :progress="isNumber(props.loading) ? props.loading : undefined"
      />
    </span>
  </button>
</template>

<style scoped>
.md-button {
  --md-button-border-radius: 20px;
  --md-button-icon-size: 18px;
  --md-button-height: 40px;
  --md-button-padding: 16px;
  --md-button-padding-left: var(--md-button-padding);
  --md-button-padding-right: var(--md-button-padding);
  --md-button-icon-gap: 8px;
  --md-button-border-width: 0px;
  --md-button-border-style: solid;
  --md-button-border-color: transparent;
  --md-button-box-sizing: border-box;
  --md-button-disabled-container-color: transparent;
  --md-button-disabled-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
  --md-button-disabled-border-color: transparent;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--md-button-height);
  padding-left: var(--md-button-padding-left);
  padding-right: var(--md-button-padding-right);
  border: var(--md-button-border-width) var(--md-button-border-style) var(--md-button-border-color);
  box-sizing: var(--md-button-box-sizing);
  border-radius: var(--md-button-border-radius);
  background: var(--md-container-color, transparent);
  box-shadow: var(--md-state-box-shadow);
  color: var(--md-content-color, inherit);
  outline-color: var(--md-state-outline-color);
  vertical-align: middle;
  font-family: var(--md-sys-typescale-label-large-font);
  line-height: var(--md-sys-typescale-label-large-line-height);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  user-select: none;
  transition-property: box-shadow, color, background-color, border-color, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  -webkit-tap-highlight-color: transparent;

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
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
    --md-symbol-size: var(--md-button-icon-size, 1lh);

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
    --md-circular-progress-color: var(--md-content-color);
  }

  &.md-button_shape-round {
    --md-button-border-radius: var(--md-button-height);
  }

  &.md-button_color-elevated {
    --md-container-color: var(--md-sys-color-surface-container-low);
    --md-content-color: var(--md-sys-color-primary);
    --md-state-box-shadow: var(--md-sys-elevation-level1);

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
      --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-content-color);
      --md-state-box-shadow: var(--md-sys-elevation-level0);
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      --md-state-box-shadow: var(--md-sys-elevation-level2);

      &.md-button_selected {
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_focused,
    &:focus-visible {
      --md-content-color: var(--md-sys-color-primary);
      --md-state-box-shadow: var(--md-sys-elevation-level1);
      z-index: 1;

      &.md-button_selected {
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }
  }

  &.md-button_color-filled {
    --md-container-color: var(--md-sys-color-primary);
    --md-content-color: var(--md-sys-color-on-primary);
    --md-button-icon-color: var(--md-sys-color-on-primary);
    --md-state-box-shadow: var(--md-sys-elevation-level0);

    &.md-button_type-toggle {
      --md-container-color: var(--md-sys-color-surface-container);
      --md-content-color: var(--md-sys-color-on-surface-variant);

      &.md-button_selected {
        --md-container-color: var(--md-sys-color-primary);
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_hover,
    &:hover {
      --md-state-box-shadow: var(--md-sys-elevation-level1);
      z-index: 1;
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-content-color);
    }
  }

  &.md-button_color-tonal {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    --md-state-box-shadow: var(--md-sys-elevation-level0);

    &.md-button_type-toggle {
      &.md-button_selected {
        --md-container-color: var(--md-sys-color-secondary);
        --md-content-color: var(--md-sys-color-on-secondary);
      }
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
      --md-state-box-shadow: var(--md-sys-elevation-level1);
      z-index: 1;
    }

    &:focus-visible,
    &.md-state_focused {
      --md-state-box-shadow: var(--md-sys-elevation-level0);
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-button-icon-color: var(--md-sys-color-on-secondary-container);
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-content-color);
    }
  }

  &.md-button_color-outlined {
    --md-button-border-style: solid;
    --md-button-border-color: var(--md-sys-color-outline-variant);
    --md-button-border-width: 1px;
    --md-button-box-sizing: border-box;
    --md-content-color: var(--md-sys-color-on-surface-variant);
    --md-state-box-shadow: var(--md-sys-elevation-level0);

    &.md-button_type-toggle {
      &.md-button_selected {
        --md-container-color: var(--md-sys-color-inverse-surface);
        --md-content-color: var(--md-sys-color-inverse-on-surface);
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: transparent;
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-content-color);
      --md-button-border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-sys-color-primary);
      --md-button-icon-color: var(--md-sys-color-primary);
      --md-button-border-color: var(--md-sys-color-outline);
    }

    &:focus-visible,
    &.md-state_focused {
      --md-content-color: var(--md-sys-color-on-surface-variant);
      --md-button-icon-color: var(--md-sys-color-on-surface-variant);
    }
  }

  &.md-button_color-text {
    --md-content-color: var(--md-sys-color-primary);
    --md-button-padding-left: 12px;
    --md-button-padding-right: 12px;
    --md-state-box-shadow: var(--md-sys-elevation-level0);

    &.md-button_icon {
      --md-button-padding-right: 16px;
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

    &.md-state_disabled,
    &:disabled {
      --md-container-color: transparent;
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-content-color);
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
