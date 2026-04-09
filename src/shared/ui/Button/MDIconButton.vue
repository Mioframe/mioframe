<script setup lang="ts">
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip, MDRichTooltip } from '../Tooltips';
import { MDSymbol } from '../Icon';
import { MDState } from '../State';

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
  /**
   * @default 'small'
   */
  size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
  width?: 'narrow' | 'default' | 'wide' | undefined;
  /**
   * @default 'round'
   */
  shape?: 'round' | 'square' | undefined;
}>();

const slots = defineSlots<{
  icon(): unknown;
  richTooltipContent(): unknown;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const onClick = (e: MouseEvent) => {
  e.stopPropagation();
  emit('click', e);
};
</script>

<template>
  <MDState
    is="button"
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
      },
    ]"
    :aria-label="tooltip"
    @click="onClick"
  >
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
  </MDState>
</template>

<style scoped>
.md-icon-button {
  --md-icon-button-container-height: unset;
  --md-icon-button-container-shape: unset;
  --md-icon-button-icon-size: 24px;
  --md-icon-button-border-width: 0px;
  --md-icon-button-padding: 0px;

  --md-state-display: inline-flex;
  --md-state-align-items: center;
  --md-state-justify-content: center;
  --md-state-border: 0;
  --md-state-border-width: var(--md-icon-button-border-width);
  --md-state-box-sizing: content-box;
  --md-state-height: calc(
    var(--md-icon-button-container-height) - (var(--md-icon-button-border-width) * 2)
  );
  --md-state-padding-top: 0;
  --md-state-padding-bottom: 0;
  --md-state-padding-left: calc(var(--md-icon-button-padding) - var(--md-icon-button-border-width));
  --md-state-padding-right: calc(
    var(--md-icon-button-padding) - var(--md-icon-button-border-width)
  );
  --md-state-border-radius: var(--md-icon-button-container-shape);
  vertical-align: middle;
  user-select: none;

  &__icon {
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
  }

  &_color-outlined {
    --md-state-border-style: solid;
    --md-state-border-color: var(--md-sys-color-outline);
    --md-icon-button-border-width: 1px;
    --md-container-color: transparent;
    --md-content-color: var(--md-sys-color-on-surface-variant);
    --md-symbol-fill: 1;

    &.md-icon-button_type-toggle {
      --md-state-border-color: var(--md-sys-color-outline);
      --md-container-color: transparent;
      --md-content-color: var(--md-sys-color-on-surface-variant);
      --md-symbol-fill: 0;

      &.md-icon-button_selected {
        --md-state-border-color: var(--md-container-color);
        --md-container-color: var(--md-sys-color-inverse-surface);
        --md-content-color: var(--md-sys-color-inverse-on-surface);
        --md-symbol-fill: 1;
      }
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
