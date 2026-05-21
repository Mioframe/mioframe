<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip, MDRichTooltip } from '../Tooltips';
import { MDSymbol } from '../Icon';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const {
  color = 'standard',
  disabled,
  focused,
  formAction,
  loading,
  mdSymbolName,
  type = 'default',
  selected,
  pressed,
  shape = 'round',
  size = 'small',
  tooltip,
  width = 'default',
} = defineProps<{
  formAction?: 'submit' | 'reset' | undefined;
  color?: 'filled' | 'tonal' | 'outlined' | 'standard' | undefined;
  disabled?: boolean | undefined;
  pressed?: boolean | undefined;
  focused?: boolean | undefined;
  loading?: number | boolean | undefined;
  tooltip: string;
  showTooltipOnClick?: boolean | undefined;
  mdSymbolName?: string | undefined;
  type?: 'default' | 'toggle' | undefined;
  selected?: boolean | undefined;
  /** Defaults to `small`. */
  size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
  width?: 'narrow' | 'default' | 'wide' | undefined;
  /** Defaults to `round`. */
  shape?: 'round' | 'square' | undefined;
}>();

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
const showVisualState = computed(() => !disabled);

useRipple(computed(() => (disabled ? undefined : buttonEl.value)));
</script>

<template>
  <button
    ref="buttonEl"
    :disabled="disabled"
    :type="formAction ?? 'button'"
    class="md-icon-button"
    :class="[
      `md-icon-button_color-${color}`,
      `md-icon-button_type-${type}`,
      `md-icon-button_size-${size}`,
      `md-icon-button_width-${width}`,
      `md-icon-button_shape-${shape}`,
      {
        'md-icon-button_selected': selected,
        'md-icon-button_pressed': pressed,
        'md-icon-button_focused': focused,
        'md-icon-button_loading': loading,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focusVisible,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_disabled': disabled,
      },
    ]"
    :aria-label="tooltip"
    @click="onClick"
  >
    <MDStateLayer
      :hover="hover"
      :focused="focusVisible"
      :pressed="durationPressedState"
      :disabled="disabled"
    />

    <span class="md-icon-button__icon">
      <slot name="icon">
        <MDSymbol v-if="mdSymbolName" :name="mdSymbolName" />
      </slot>
    </span>

    <MDCircularProgressIndicator
      v-if="loading"
      class="md-icon-button__progress-indicator"
      :progress="loading === true ? 0 : loading"
    />

    <MDRichTooltip
      v-if="slots.richTooltipContent"
      :subhead="tooltip"
      use-hover
      :use-click="showTooltipOnClick"
    >
      <template #text>
        <slot name="richTooltipContent" />
      </template>
    </MDRichTooltip>

    <MDPlainTooltip v-else :text="tooltip" />
  </button>
</template>

<style scoped>
.md-icon-button {
  --md-icon-button-container-height: unset;
  --md-icon-button-container-shape: unset;
  --md-icon-button-icon-size: 24px;
  --md-icon-button-border-width: 0px;
  --md-icon-button-padding: 0px;
  --md-icon-button-disabled-content-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
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
  user-select: none;
  transition-property: color, background-color, border-color, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  -webkit-tap-highlight-color: transparent;

  &__icon {
    position: relative;
    z-index: 1;
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
    width: var(--md-icon-button-icon-size, 1lh);
    height: var(--md-icon-button-icon-size, 1lh);
  }

  &_color-filled {
    --md-container-color: var(--md-sys-color-primary);
    --md-content-color: var(--md-sys-color-on-primary);
    --md-symbol-fill: 1;

    &.md-icon-button_type-toggle {
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
      --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.1);
      --md-content-color: var(--md-icon-button-disabled-content-color);
      --md-symbol-fill: 0;
    }
  }

  &_color-tonal {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-symbol-fill: 1;

    &.md-icon-button_type-toggle {
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
      --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.1);
      --md-content-color: var(--md-icon-button-disabled-content-color);
      --md-symbol-fill: 0;
    }
  }

  &_color-outlined {
    border-style: solid;
    border-color: var(--md-sys-color-outline);
    --md-icon-button-border-width: 1px;
    --md-container-color: transparent;
    --md-content-color: var(--md-sys-color-on-surface-variant);
    --md-symbol-fill: 1;

    &.md-icon-button_type-toggle {
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
    --md-content-color: var(--md-sys-color-on-surface-variant);
    --md-container-color: transparent;
    --md-symbol-fill: 1;

    &.md-icon-button_type-toggle {
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
    &-extra-small {
      --md-icon-button-container-height: 32dp;
      --md-icon-button-icon-size: 20dp;

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: 4dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: 6dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: 10dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-small);
      }
    }
    &-small {
      --md-icon-button-container-height: 40dp;
      --md-icon-button-icon-size: 24dp;

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: 4dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: 8dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: 14dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-small);
      }
    }
    &-medium {
      --md-icon-button-container-height: 56dp;
      --md-icon-button-icon-size: 24dp;

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: 12dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: 16dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: 24dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-large);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-large);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);
      }
    }
    &-large {
      --md-icon-button-container-height: 96dp;
      --md-icon-button-icon-size: 32dp;

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: 16dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: 32dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: 48dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-extra-large);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-extra-large);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-large);
      }
    }
    &-extra-large {
      --md-icon-button-container-height: 136dp;
      --md-icon-button-icon-size: 40dp;

      &.md-icon-button_width-narrow {
        --md-icon-button-padding: 32dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-padding: 48dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-padding: 72dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-extra-large);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-extra-large);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(var(--md-icon-button-container-height) / 2);
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-large);
      }
    }
  }
}
</style>
