<script setup lang="ts">
import { computed, onMounted, useTemplateRef, warn, watchEffect } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip, MDRichTooltip } from '../Tooltips';
import { MDSymbol } from '../Icon';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const props = withDefaults(
  defineProps<{
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    color?: 'filled' | 'tonal' | 'outlined' | 'standard' | undefined;
    disabled?: boolean | undefined;
    loading?: number | boolean | undefined;
    tooltip: string;
    showTooltipOnClick?: boolean | undefined;
    mdSymbolName?: string | undefined;
    variant?: 'default' | 'toggle' | undefined;
    selected?: boolean | undefined;
    /** Defaults to `small`. */
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    width?: 'narrow' | 'default' | 'wide' | undefined;
    /** Defaults to `round`. */
    shape?: 'round' | 'square' | undefined;
  }>(),
  {
    color: 'standard',
    nativeType: 'button',
    variant: 'default',
    shape: 'round',
    size: 'small',
    width: 'default',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const slots = defineSlots<{
  icon(): unknown;
  richTooltipContent(): unknown;
}>();

const onClick = (e: MouseEvent) => {
  e.stopPropagation();
  emit('click', e);
};

const buttonEl = useTemplateRef<HTMLButtonElement>('buttonEl');
const { hover, focused: focusVisible, durationPressedState } = useStateLayer(buttonEl);
const showVisualState = computed(() => !props.disabled);
const isToggle = computed(() => props.variant === 'toggle');
const appliedSelected = computed(() => isToggle.value && !!props.selected);

useRipple(computed(() => (props.disabled ? undefined : buttonEl.value)));

if (import.meta.env.DEV) {
  onMounted(() => {
    watchEffect(() => {
      if (props.selected && !isToggle.value) {
        warn('MDIconButton: `selected` has no effect unless `variant` is "toggle".');
      }
    });
  });
}
</script>

<template>
  <button
    ref="buttonEl"
    :disabled="disabled"
    :type="props.nativeType"
    class="md-icon-button"
    :class="[
      `md-icon-button_color-${props.color}`,
      `md-icon-button_variant-${props.variant}`,
      `md-icon-button_size-${props.size}`,
      `md-icon-button_width-${props.width}`,
      `md-icon-button_shape-${props.shape}`,
      {
        'md-icon-button_selected': appliedSelected,
        'md-icon-button_loading': props.loading !== undefined && props.loading !== false,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focusVisible,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_disabled': props.disabled,
      },
    ]"
    :aria-label="props.tooltip"
    :aria-pressed="isToggle ? appliedSelected : undefined"
    @click="onClick"
  >
    <span class="md-icon-button__target" aria-hidden="true" />

    <MDStateLayer
      :hover="hover"
      :focused="focusVisible"
      :pressed="durationPressedState"
      :disabled="props.disabled"
    />

    <span class="md-icon-button__icon">
      <slot name="icon">
        <MDSymbol v-if="props.mdSymbolName" :name="props.mdSymbolName" />
      </slot>
    </span>

    <MDCircularProgressIndicator
      v-if="props.loading !== undefined && props.loading !== false"
      class="md-icon-button__progress-indicator"
      :progress="props.loading === true ? 0 : props.loading"
    />

    <MDRichTooltip
      v-if="slots.richTooltipContent"
      :subhead="props.tooltip"
      use-hover
      :use-click="props.showTooltipOnClick"
    >
      <template #text>
        <slot name="richTooltipContent" />
      </template>
    </MDRichTooltip>

    <MDPlainTooltip v-else :text="props.tooltip" />
  </button>
</template>

<style scoped>
.md-icon-button {
  /* Component tokens shared across color styles (md.comp.icon-button.*.disabled.*). */
  --md-comp-icon-button-disabled-icon-color: var(--md-sys-color-on-surface);
  --md-comp-icon-button-disabled-icon-opacity: 0.38;
  --md-comp-icon-button-disabled-container-color: var(--md-sys-color-on-surface);
  --md-comp-icon-button-disabled-container-opacity: 0.1;

  --md-icon-button-container-height: unset;
  --md-icon-button-container-shape: unset;
  --md-icon-button-icon-size: 24px;
  --md-icon-button-border-width: 0px;
  --md-icon-button-padding: 0px;
  --md-icon-button-target-size: var(--md-icon-button-container-height);
  --md-icon-button-disabled-content-color: rgb(
    from var(--md-comp-icon-button-disabled-icon-color) r g b /
      var(--md-comp-icon-button-disabled-icon-opacity)
  );
  --md-icon-button-disabled-container-tint: rgb(
    from var(--md-comp-icon-button-disabled-container-color) r g b /
      var(--md-comp-icon-button-disabled-container-opacity)
  );
  --md-icon-button-disabled-container-color: transparent;
  --md-icon-button-disabled-border-color: transparent;

  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: calc(var(--md-icon-button-container-height) - (var(--md-icon-button-border-width) * 2));
  padding: 0 calc(var(--md-icon-button-padding) - var(--md-icon-button-border-width));
  border-radius: var(--md-icon-button-container-shape);
  border: var(--md-icon-button-border-width) solid transparent;
  box-sizing: content-box;
  background: var(--md-container-color, transparent);
  color: var(--md-content-color, inherit);
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  transition-property: color, background-color, border-color, border-radius;
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
    width: var(--md-icon-button-target-size);
    height: var(--md-icon-button-target-size);
    min-width: var(--md-icon-button-target-size);
    min-height: var(--md-icon-button-target-size);
    transform: translate(-50%, -50%);
    background: transparent;
  }

  &__icon {
    position: relative;
    z-index: 2;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--md-icon-button-icon-size, 1lh);
    height: var(--md-icon-button-icon-size, 1lh);
    color: var(--md-content-color, inherit);
    background: transparent;
    transition-property: opacity;
    transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
    --md-symbol-size: var(--md-icon-button-icon-size);

    .md-icon-button_loading & {
      opacity: 0;
    }
  }

  &__progress-indicator {
    position: absolute;
    z-index: 2;
    width: var(--md-icon-button-icon-size, 1lh);
    height: var(--md-icon-button-icon-size, 1lh);
  }

  &_color-filled {
    --md-comp-icon-button-filled-container-color: var(--md-sys-color-primary);
    --md-comp-icon-button-filled-icon-color: var(--md-sys-color-on-primary);

    --md-container-color: var(--md-comp-icon-button-filled-container-color);
    --md-content-color: var(--md-comp-icon-button-filled-icon-color);
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      --md-container-color: var(--md-sys-color-surface-container-highest);
      --md-content-color: var(--md-sys-color-primary);
      --md-symbol-fill: 0;

      &.md-icon-button_selected {
        --md-container-color: var(--md-sys-color-primary);
        --md-content-color: var(--md-sys-color-on-primary);
        --md-symbol-fill: 1;
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: var(--md-icon-button-disabled-container-tint);
      --md-content-color: var(--md-icon-button-disabled-content-color);
      --md-symbol-fill: 0;
    }
  }

  &_color-tonal {
    --md-comp-icon-button-tonal-container-color: var(--md-sys-color-secondary-container);
    --md-comp-icon-button-tonal-icon-color: var(--md-sys-color-on-secondary-container);

    --md-container-color: var(--md-comp-icon-button-tonal-container-color);
    --md-content-color: var(--md-comp-icon-button-tonal-icon-color);
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      --md-container-color: var(--md-sys-color-surface-container-highest);
      --md-content-color: var(--md-sys-color-on-surface-variant);
      --md-symbol-fill: 0;

      &.md-icon-button_selected {
        --md-container-color: var(--md-sys-color-secondary-container);
        --md-content-color: var(--md-sys-color-on-secondary-container);
        --md-symbol-fill: 1;
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: var(--md-icon-button-disabled-container-tint);
      --md-content-color: var(--md-icon-button-disabled-content-color);
      --md-symbol-fill: 0;
    }
  }

  &_color-outlined {
    --md-comp-icon-button-outlined-outline-color: var(--md-sys-color-outline);
    --md-comp-icon-button-outlined-icon-color: var(--md-sys-color-on-surface-variant);

    border-style: solid;
    border-color: var(--md-comp-icon-button-outlined-outline-color);
    --md-icon-button-border-width: 1px;
    --md-container-color: transparent;
    --md-content-color: var(--md-comp-icon-button-outlined-icon-color);
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      border-color: var(--md-sys-color-outline);
      --md-container-color: transparent;
      --md-content-color: var(--md-sys-color-on-surface-variant);
      --md-symbol-fill: 0;

      &.md-icon-button_selected {
        border-color: var(--md-container-color);
        --md-container-color: var(--md-sys-color-inverse-surface);
        --md-content-color: var(--md-sys-color-inverse-on-surface);
        --md-symbol-fill: 1;
      }
    }

    &.md-state_disabled,
    &:disabled {
      border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
      --md-container-color: transparent;
      --md-content-color: var(--md-icon-button-disabled-content-color);
      --md-symbol-fill: 0;
    }
  }

  &_color-standard {
    --md-comp-icon-button-standard-icon-color: var(--md-sys-color-on-surface-variant);

    --md-content-color: var(--md-comp-icon-button-standard-icon-color);
    --md-container-color: transparent;
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      --md-container-color: transparent;
      --md-content-color: var(--md-sys-color-on-surface-variant);
      --md-symbol-fill: 0;

      &.md-icon-button_selected {
        --md-container-color: transparent;
        --md-content-color: var(--md-sys-color-primary);
        --md-symbol-fill: 1;
      }
    }

    &.md-state_disabled,
    &:disabled {
      --md-container-color: transparent;
      --md-content-color: var(--md-icon-button-disabled-content-color);
      --md-symbol-fill: 0;
    }
  }

  &_size {
    /* Public size prop values keep the project's extra-small/extra-large naming;
       the official token path segments (md.comp.icon-button.xsmall/xlarge.*) are
       used for the --md-comp-icon-button-* custom property names below. */
    &-extra-small {
      --md-comp-icon-button-xsmall-container-height: 32dp;
      --md-comp-icon-button-xsmall-icon-size: 20dp;
      --md-comp-icon-button-xsmall-target-size: 48dp;
      --md-comp-icon-button-xsmall-narrow-space: 4dp;
      --md-comp-icon-button-xsmall-default-space: 6dp;
      --md-comp-icon-button-xsmall-wide-space: 10dp;
      --md-comp-icon-button-xsmall-shape-round: calc(
        var(--md-comp-icon-button-xsmall-container-height) / 2
      );
      --md-comp-icon-button-xsmall-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-icon-button-xsmall-pressed-shape: var(--md-sys-shape-corner-small);

      --md-icon-button-container-height: var(--md-comp-icon-button-xsmall-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-xsmall-icon-size);
      --md-icon-button-target-size: var(--md-comp-icon-button-xsmall-target-size);

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: var(--md-comp-icon-button-xsmall-narrow-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: var(--md-comp-icon-button-xsmall-default-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: var(--md-comp-icon-button-xsmall-wide-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-shape-round);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-shape-square);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-shape-square);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-shape-round);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-pressed-shape);
      }
    }
    &-small {
      --md-comp-icon-button-small-container-height: 40dp;
      --md-comp-icon-button-small-icon-size: 24dp;
      --md-comp-icon-button-small-target-size: 48dp;
      --md-comp-icon-button-small-narrow-space: 4dp;
      --md-comp-icon-button-small-default-space: 8dp;
      --md-comp-icon-button-small-wide-space: 14dp;
      --md-comp-icon-button-small-shape-round: calc(
        var(--md-comp-icon-button-small-container-height) / 2
      );
      --md-comp-icon-button-small-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-icon-button-small-pressed-shape: var(--md-sys-shape-corner-small);

      --md-icon-button-container-height: var(--md-comp-icon-button-small-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-small-icon-size);
      --md-icon-button-target-size: var(--md-comp-icon-button-small-target-size);

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: var(--md-comp-icon-button-small-narrow-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: var(--md-comp-icon-button-small-default-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: var(--md-comp-icon-button-small-wide-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-small-shape-round);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-small-shape-square);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-small-shape-square);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-small-shape-round);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-comp-icon-button-small-pressed-shape);
      }
    }
    &-medium {
      --md-comp-icon-button-medium-container-height: 56dp;
      --md-comp-icon-button-medium-icon-size: 24dp;
      --md-comp-icon-button-medium-narrow-space: 12dp;
      --md-comp-icon-button-medium-default-space: 16dp;
      --md-comp-icon-button-medium-wide-space: 24dp;
      --md-comp-icon-button-medium-shape-round: calc(
        var(--md-comp-icon-button-medium-container-height) / 2
      );
      --md-comp-icon-button-medium-shape-square: var(--md-sys-shape-corner-large);
      --md-comp-icon-button-medium-pressed-shape: var(--md-sys-shape-corner-medium);

      --md-icon-button-container-height: var(--md-comp-icon-button-medium-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-medium-icon-size);

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: var(--md-comp-icon-button-medium-narrow-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: var(--md-comp-icon-button-medium-default-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: var(--md-comp-icon-button-medium-wide-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-medium-shape-round);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-medium-shape-square);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-medium-shape-square);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-medium-shape-round);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-comp-icon-button-medium-pressed-shape);
      }
    }
    &-large {
      --md-comp-icon-button-large-container-height: 96dp;
      --md-comp-icon-button-large-icon-size: 32dp;
      --md-comp-icon-button-large-narrow-space: 16dp;
      --md-comp-icon-button-large-default-space: 32dp;
      --md-comp-icon-button-large-wide-space: 48dp;
      --md-comp-icon-button-large-shape-round: calc(
        var(--md-comp-icon-button-large-container-height) / 2
      );
      --md-comp-icon-button-large-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-icon-button-large-pressed-shape: var(--md-sys-shape-corner-large);

      --md-icon-button-container-height: var(--md-comp-icon-button-large-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-large-icon-size);

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: var(--md-comp-icon-button-large-narrow-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: var(--md-comp-icon-button-large-default-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: var(--md-comp-icon-button-large-wide-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-large-shape-round);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-large-shape-square);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-large-shape-square);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-large-shape-round);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-comp-icon-button-large-pressed-shape);
      }
    }
    &-extra-large {
      --md-comp-icon-button-xlarge-container-height: 136dp;
      --md-comp-icon-button-xlarge-icon-size: 40dp;
      --md-comp-icon-button-xlarge-narrow-space: 32dp;
      --md-comp-icon-button-xlarge-default-space: 48dp;
      --md-comp-icon-button-xlarge-wide-space: 72dp;
      --md-comp-icon-button-xlarge-shape-round: calc(
        var(--md-comp-icon-button-xlarge-container-height) / 2
      );
      --md-comp-icon-button-xlarge-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-icon-button-xlarge-pressed-shape: var(--md-sys-shape-corner-large);

      --md-icon-button-container-height: var(--md-comp-icon-button-xlarge-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-xlarge-icon-size);

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: var(--md-comp-icon-button-xlarge-narrow-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: var(--md-comp-icon-button-xlarge-default-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: var(--md-comp-icon-button-xlarge-wide-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-shape-round);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-shape-square);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-shape-square);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-shape-round);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-pressed-shape);
      }
    }
  }
}
</style>
