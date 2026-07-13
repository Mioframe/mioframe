<script setup lang="ts">
import { isNumber } from 'es-toolkit/compat';
import { computed, onMounted, useTemplateRef, warn, watchEffect } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const props = withDefaults(
  defineProps<{
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | undefined;
    label: string;
    disabled?: boolean | undefined;
    loading?: number | boolean | undefined;
    variant?: 'default' | 'toggle' | undefined;
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    shape?: 'round' | 'square' | undefined;
    selected?: boolean | undefined;
  }>(),
  {
    color: 'filled',
    nativeType: 'button',
    variant: 'default',
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
const isToggle = computed(() => props.variant === 'toggle');
const isTextToggle = computed(() => isToggle.value && props.color === 'text');
const appliedSelected = computed(() => isToggle.value && !isTextToggle.value && !!props.selected);

useRipple(computed(() => (props.disabled ? undefined : buttonEl.value)));

if (import.meta.env.DEV) {
  onMounted(() => {
    watchEffect(() => {
      if (props.selected && !isToggle.value) {
        warn('MDButton: `selected` has no effect unless `variant` is "toggle".');
      }

      if (isTextToggle.value) {
        warn('MDButton: Material 3 does not define a toggle variant for `color="text"`.');
      }
    });
  });
}
</script>

<template>
  <button
    ref="buttonEl"
    :aria-label="props.label"
    :aria-pressed="isToggle ? appliedSelected : undefined"
    :disabled="props.disabled"
    :type="props.nativeType"
    class="md-button"
    :class="[
      `md-button_color-${props.color}`,
      `md-button_variant-${props.variant}`,
      `md-button_size-${props.size}`,
      `md-button_shape-${props.shape}`,
      {
        'md-button_icon': !!$slots.icon,
        'md-button_loading': props.loading !== undefined && props.loading !== false,
        'md-button_selected': appliedSelected,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focused,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_disabled': props.disabled,
      },
    ]"
    @click.stop="onButtonClick"
  >
    <span class="md-button__target" aria-hidden="true" />

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
  /* Component tokens shared across color styles (md.comp.button.*.disabled.*). */
  --md-comp-button-disabled-label-text-color: var(--md-sys-color-on-surface);
  --md-comp-button-disabled-label-text-opacity: 0.38;
  --md-comp-button-disabled-icon-color: var(--md-sys-color-on-surface);
  --md-comp-button-disabled-icon-opacity: 0.38;
  --md-comp-button-disabled-container-color: var(--md-sys-color-on-surface);
  --md-comp-button-disabled-container-opacity: 0.1;

  --md-button-border-radius: 20px;
  --md-button-icon-size: 20dp;
  --md-button-height: 40px;
  --md-button-padding: 16px;
  --md-button-padding-left: var(--md-button-padding);
  --md-button-padding-right: var(--md-button-padding);
  --md-button-icon-gap: 8px;
  --md-button-border-width: 0px;
  --md-button-border-style: solid;
  --md-button-border-color: transparent;
  --md-button-box-sizing: border-box;
  --md-button-target-size: var(--md-button-height);
  --md-button-disabled-container-color: transparent;
  --md-button-disabled-container-tint: rgb(
    from var(--md-comp-button-disabled-container-color) r g b /
      var(--md-comp-button-disabled-container-opacity)
  );
  --md-button-disabled-content-color: rgb(
    from var(--md-comp-button-disabled-label-text-color) r g b /
      var(--md-comp-button-disabled-label-text-opacity)
  );
  --md-button-disabled-icon-tint: rgb(
    from var(--md-comp-button-disabled-icon-color) r g b /
      var(--md-comp-button-disabled-icon-opacity)
  );
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
  cursor: pointer;
  font-family: var(--md-sys-typescale-label-large-font);
  line-height: var(--md-sys-typescale-label-large-line-height);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  user-select: none;
  transition-property: box-shadow, color, background-color, border-color, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    cursor: default;
  }

  &__target {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 0;
    display: block;
    width: var(--md-button-target-size);
    height: var(--md-button-target-size);
    min-width: var(--md-button-target-size);
    min-height: var(--md-button-target-size);
    transform: translate(-50%, -50%);
    background: transparent;
  }

  &__content {
    position: relative;
    z-index: 2;
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
    z-index: 2;
    width: 24px;
    height: 24px;
    --md-circular-progress-color: var(--md-content-color);
  }

  &.md-button_shape-round {
    --md-button-border-radius: var(--md-button-height);
  }

  &.md-button_color-elevated {
    --md-comp-button-elevated-container-color: var(--md-sys-color-surface-container-low);
    --md-comp-button-elevated-label-text-color: var(--md-sys-color-primary);
    --md-comp-button-elevated-icon-color: var(--md-sys-color-primary);
    --md-comp-button-elevated-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-button-elevated-hovered-container-elevation: var(--md-sys-elevation-level2);
    --md-comp-button-elevated-focused-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-button-elevated-pressed-container-elevation: var(--md-sys-elevation-level1);
    --md-comp-button-elevated-disabled-container-elevation: var(--md-sys-elevation-level0);

    --md-container-color: var(--md-comp-button-elevated-container-color);
    --md-content-color: var(--md-comp-button-elevated-label-text-color);
    --md-button-icon-color: var(--md-comp-button-elevated-icon-color);
    --md-state-box-shadow: var(--md-comp-button-elevated-container-elevation);

    &.md-button_variant-toggle {
      --md-container-color: var(--md-sys-color-surface-container-low);
      --md-content-color: var(--md-sys-color-primary);

      &.md-button_selected {
        --md-container-color: var(--md-sys-color-primary);
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: var(--md-button-disabled-container-tint);
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-icon-tint);
      --md-state-box-shadow: var(--md-comp-button-elevated-disabled-container-elevation);
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-comp-button-elevated-label-text-color);
      --md-state-box-shadow: var(--md-comp-button-elevated-hovered-container-elevation);

      &.md-button_selected {
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_focused,
    &:focus-visible {
      --md-content-color: var(--md-comp-button-elevated-label-text-color);
      --md-state-box-shadow: var(--md-comp-button-elevated-focused-container-elevation);
      z-index: 1;

      &.md-button_selected {
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }
  }

  &.md-button_color-filled {
    --md-comp-button-filled-container-color: var(--md-sys-color-primary);
    --md-comp-button-filled-label-text-color: var(--md-sys-color-on-primary);
    --md-comp-button-filled-icon-color: var(--md-sys-color-on-primary);
    --md-comp-button-filled-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-button-filled-hovered-container-elevation: var(--md-sys-elevation-level1);

    --md-container-color: var(--md-comp-button-filled-container-color);
    --md-content-color: var(--md-comp-button-filled-label-text-color);
    --md-button-icon-color: var(--md-comp-button-filled-icon-color);
    --md-state-box-shadow: var(--md-comp-button-filled-container-elevation);

    &.md-button_variant-toggle {
      --md-container-color: var(--md-sys-color-surface-container);
      --md-content-color: var(--md-sys-color-on-surface-variant);

      &.md-button_selected {
        --md-container-color: var(--md-sys-color-primary);
        --md-content-color: var(--md-sys-color-on-primary);
      }
    }

    &.md-state_hover,
    &:hover {
      --md-state-box-shadow: var(--md-comp-button-filled-hovered-container-elevation);
      z-index: 1;
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: var(--md-button-disabled-container-tint);
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-icon-tint);
    }
  }

  &.md-button_color-tonal {
    --md-comp-button-tonal-container-color: var(--md-sys-color-secondary-container);
    --md-comp-button-tonal-label-text-color: var(--md-sys-color-on-secondary-container);
    --md-comp-button-tonal-icon-color: var(--md-sys-color-on-secondary-container);
    --md-comp-button-tonal-container-elevation: var(--md-sys-elevation-level0);
    --md-comp-button-tonal-hovered-container-elevation: var(--md-sys-elevation-level1);

    --md-container-color: var(--md-comp-button-tonal-container-color);
    --md-content-color: var(--md-comp-button-tonal-label-text-color);
    --md-button-icon-color: var(--md-comp-button-tonal-icon-color);
    --md-state-box-shadow: var(--md-comp-button-tonal-container-elevation);

    &.md-button_variant-toggle {
      &.md-button_selected {
        --md-container-color: var(--md-sys-color-secondary);
        --md-content-color: var(--md-sys-color-on-secondary);
      }
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-comp-button-tonal-label-text-color);
      --md-button-icon-color: var(--md-comp-button-tonal-icon-color);
      --md-state-box-shadow: var(--md-comp-button-tonal-hovered-container-elevation);
      z-index: 1;
    }

    &:focus-visible,
    &.md-state_focused {
      --md-state-box-shadow: var(--md-comp-button-tonal-container-elevation);
      --md-content-color: var(--md-comp-button-tonal-label-text-color);
      --md-button-icon-color: var(--md-comp-button-tonal-icon-color);
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: var(--md-button-disabled-container-tint);
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-icon-tint);
    }
  }

  &.md-button_color-outlined {
    --md-comp-button-outlined-outline-color: var(--md-sys-color-outline-variant);
    --md-comp-button-outlined-label-text-color: var(--md-sys-color-on-surface-variant);
    --md-comp-button-outlined-icon-color: var(--md-sys-color-on-surface-variant);

    --md-button-border-style: solid;
    --md-button-border-color: var(--md-comp-button-outlined-outline-color);
    --md-button-border-width: 1px;
    --md-button-box-sizing: border-box;
    --md-content-color: var(--md-comp-button-outlined-label-text-color);
    --md-button-icon-color: var(--md-comp-button-outlined-icon-color);
    --md-state-box-shadow: var(--md-sys-elevation-level0);

    &.md-button_variant-toggle {
      &.md-button_selected {
        --md-container-color: var(--md-sys-color-inverse-surface);
        --md-content-color: var(--md-sys-color-inverse-on-surface);
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: transparent;
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-icon-tint);
      /* Kept as the existing on-surface/12% treatment (not the literal
         md.comp.button.outlined.disabled.outline.color = outline-variant) pending a
         fresh visual comparison; see docs/material-3/component-family-audit.md. */
      --md-button-border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
    }

    &.md-state_hover,
    &:hover {
      /* Kept as the existing outline-darkening treatment (not the literal
         md.comp.button.outlined.hovered.outline.color = outline-variant, unchanged from
         default) pending a fresh visual comparison; see component-family-audit.md. */
      --md-content-color: var(--md-sys-color-primary);
      --md-button-icon-color: var(--md-sys-color-primary);
      --md-button-border-color: var(--md-sys-color-outline);
    }

    &:focus-visible,
    &.md-state_focused {
      --md-content-color: var(--md-comp-button-outlined-label-text-color);
      --md-button-icon-color: var(--md-comp-button-outlined-icon-color);
    }
  }

  &.md-button_color-text {
    --md-comp-button-text-label-text-color: var(--md-sys-color-primary);
    --md-comp-button-text-icon-color: var(--md-sys-color-primary);

    --md-content-color: var(--md-comp-button-text-label-text-color);
    --md-button-icon-color: var(--md-comp-button-text-icon-color);
    --md-button-padding-left: 12px;
    --md-button-padding-right: 12px;
    --md-state-box-shadow: var(--md-sys-elevation-level0);

    &.md-button_icon {
      --md-button-padding-right: 16px;
    }

    &.md-state_hover,
    &:hover {
      --md-content-color: var(--md-comp-button-text-label-text-color);
      --md-button-icon-color: var(--md-comp-button-text-icon-color);
    }

    &:focus-visible,
    &.md-state_focused {
      --md-content-color: var(--md-comp-button-text-label-text-color);
      --md-button-icon-color: var(--md-comp-button-text-icon-color);
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: transparent;
      --md-content-color: var(--md-button-disabled-content-color);
      --md-button-icon-color: var(--md-button-disabled-icon-tint);
    }
  }

  &.md-button_size {
    &-extra-small {
      --md-comp-button-extra-small-container-height: 32dp;
      --md-comp-button-extra-small-icon-size: 20dp;
      --md-comp-button-extra-small-leading-space: 12dp;
      --md-comp-button-extra-small-icon-label-space: 8dp;
      --md-comp-button-extra-small-outlined-outline-width: 1dp;
      --md-comp-button-extra-small-container-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-button-extra-small-pressed-container-shape: var(--md-sys-shape-corner-small);

      --md-button-height: var(--md-comp-button-extra-small-container-height);
      --md-button-icon-size: var(--md-comp-button-extra-small-icon-size);
      --md-button-padding: var(--md-comp-button-extra-small-leading-space);
      --md-button-icon-gap: var(--md-comp-button-extra-small-icon-label-space);
      --md-button-target-size: 48dp;

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-extra-small-outlined-outline-width);
      }

      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-extra-small-container-shape-square);
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: var(--md-comp-button-extra-small-pressed-container-shape);
      }
    }

    &-small {
      --md-comp-button-small-container-height: 40dp;
      --md-comp-button-small-icon-size: 20dp;
      --md-comp-button-small-leading-space: 16dp;
      --md-comp-button-small-icon-label-space: 8dp;
      --md-comp-button-small-outlined-outline-width: 1dp;
      --md-comp-button-small-container-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-button-small-pressed-container-shape: var(--md-sys-shape-corner-small);

      --md-button-height: var(--md-comp-button-small-container-height);
      --md-button-icon-size: var(--md-comp-button-small-icon-size);
      --md-button-padding: var(--md-comp-button-small-leading-space);
      --md-button-icon-gap: var(--md-comp-button-small-icon-label-space);
      --md-button-target-size: 48dp;

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-small-outlined-outline-width);
      }

      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-small-container-shape-square);
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: var(--md-comp-button-small-pressed-container-shape);
      }
    }

    &-medium {
      --md-comp-button-medium-container-height: 56dp;
      --md-comp-button-medium-icon-size: 24dp;
      --md-comp-button-medium-leading-space: 24dp;
      --md-comp-button-medium-icon-label-space: 8dp;
      --md-comp-button-medium-outlined-outline-width: 1dp;
      --md-comp-button-medium-container-shape-square: var(--md-sys-shape-corner-large);
      --md-comp-button-medium-pressed-container-shape: var(--md-sys-shape-corner-medium);

      --md-button-height: var(--md-comp-button-medium-container-height);
      --md-button-icon-size: var(--md-comp-button-medium-icon-size);
      --md-button-padding: var(--md-comp-button-medium-leading-space);
      --md-button-icon-gap: var(--md-comp-button-medium-icon-label-space);

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-medium-outlined-outline-width);
      }

      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-medium-container-shape-square);
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: var(--md-comp-button-medium-pressed-container-shape);
      }
    }

    &-large {
      --md-comp-button-large-container-height: 96dp;
      --md-comp-button-large-icon-size: 32dp;
      --md-comp-button-large-leading-space: 48dp;
      --md-comp-button-large-icon-label-space: 12dp;
      --md-comp-button-large-outlined-outline-width: 2dp;
      --md-comp-button-large-container-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-button-large-pressed-container-shape: var(--md-sys-shape-corner-large);

      --md-button-height: var(--md-comp-button-large-container-height);
      --md-button-icon-size: var(--md-comp-button-large-icon-size);
      --md-button-padding: var(--md-comp-button-large-leading-space);
      --md-button-icon-gap: var(--md-comp-button-large-icon-label-space);

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-large-outlined-outline-width);
      }

      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-large-container-shape-square);
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: var(--md-comp-button-large-pressed-container-shape);
      }
    }

    &-extra-large {
      --md-comp-button-extra-large-container-height: 136dp;
      --md-comp-button-extra-large-icon-size: 40dp;
      --md-comp-button-extra-large-leading-space: 64dp;
      --md-comp-button-extra-large-icon-label-space: 16dp;
      --md-comp-button-extra-large-outlined-outline-width: 3dp;
      --md-comp-button-extra-large-container-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-button-extra-large-pressed-container-shape: var(--md-sys-shape-corner-large);

      --md-button-height: var(--md-comp-button-extra-large-container-height);
      --md-button-icon-size: var(--md-comp-button-extra-large-icon-size);
      --md-button-padding: var(--md-comp-button-extra-large-leading-space);
      --md-button-icon-gap: var(--md-comp-button-extra-large-icon-label-space);

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-extra-large-outlined-outline-width);
      }

      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-extra-large-container-shape-square);
      }

      &.md-state_pressed,
      &:active {
        --md-button-border-radius: var(--md-comp-button-extra-large-pressed-container-shape);
      }
    }
  }
}
</style>
