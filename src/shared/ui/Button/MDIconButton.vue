<script setup lang="ts">
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip } from '../Tooltips';
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
  selected = false,
  pressed,
  shape = 'round',
  size = 'small',
  tooltip,
  width = 'default',
} = defineProps<{
  formAction?: 'submit' | 'reset';
  color?: 'filled' | 'tonal' | 'outlined' | 'standard';
  disabled?: boolean;
  pressed?: boolean;
  focused?: boolean;
  loading?: number | boolean;
  tooltip: string; // FIXME: v-md-tooltip зависает
  mdSymbolName?: string;
  type?: 'default' | 'toggle';
  selected?: boolean;
  /**
   * @default 'size'
   */
  size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
  width?: 'narrow' | 'default' | 'wide';
  /**
   * @default 'shape'
   */
  shape?: 'round' | 'square';
}>();

defineSlots<{
  icon(): unknown;
  tooltipContainer(): unknown; // TODO: содержимое для RichTooltip
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

// TODO: обновить кнопки до m3 expressive для комфортного размещения в list
</script>

<template>
  <MDState
    is="button"
    :disabled="disabled"
    :type="formAction ?? 'button'"
    class="md md-icon-button"
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
    @click.stop="emit('click', $event)"
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

    <MDPlainTooltip :text="tooltip" />
  </MDState>
</template>

<style scoped>
.md-icon-button {
  --md-icon-button-icon-size: 24px;
  --md-icon-button-border-width: 0px;

  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 0;
  border-width: var(--md-icon-button-border-width);
  box-sizing: content-box;
  height: calc(
    var(--md-icon-button-container-height) -
      (var(--md-icon-button-border-width) * 2)
  );
  padding-left: calc(
    var(--md-icon-button-leading-space) - var(--md-icon-button-border-width)
  );
  padding-right: calc(
    var(--md-icon-button-trailing-space) - var(--md-icon-button-border-width)
  );
  border-radius: var(--md-icon-button-container-shape);

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
        --md-icon-button-leading-space: 4dp;
        --md-icon-button-trailing-space: 4dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: 6dp;
        --md-icon-button-trailing-space: 6dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: 10dp;
        --md-icon-button-trailing-space: 10dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(
          var(--md-icon-button-container-height) / 2
        );

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(
            var(--md-icon-button-container-height) / 2
          );
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
        --md-icon-button-leading-space: 4dp;
        --md-icon-button-trailing-space: 4dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: 8dp;
        --md-icon-button-trailing-space: 8dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: 14dp;
        --md-icon-button-trailing-space: 14dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(
          var(--md-icon-button-container-height) / 2
        );

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-medium);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(
            var(--md-icon-button-container-height) / 2
          );
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
        --md-icon-button-leading-space: 12dp;
        --md-icon-button-trailing-space: 12dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: 16dp;
        --md-icon-button-trailing-space: 16dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: 24dp;
        --md-icon-button-trailing-space: 24dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(
          var(--md-icon-button-container-height) / 2
        );

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(--md-sys-shape-corner-large);
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-large);

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(
            var(--md-icon-button-container-height) / 2
          );
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
        --md-icon-button-leading-space: 16dp;
        --md-icon-button-trailing-space: 16dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: 32dp;
        --md-icon-button-trailing-space: 32dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: 48dp;
        --md-icon-button-trailing-space: 48dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(
          var(--md-icon-button-container-height) / 2
        );

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(
            --md-sys-shape-corner-extra-large
          );
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(
          --md-sys-shape-corner-extra-large
        );

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(
            var(--md-icon-button-container-height) / 2
          );
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
        --md-icon-button-leading-space: 32dp;
        --md-icon-button-trailing-space: 32dp;
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: 48dp;
        --md-icon-button-trailing-space: 48dp;
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: 72dp;
        --md-icon-button-trailing-space: 72dp;
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: calc(
          var(--md-icon-button-container-height) / 2
        );

        &.md-icon-button_selected {
          --md-icon-button-container-shape: var(
            --md-sys-shape-corner-extra-large
          );
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(
          --md-sys-shape-corner-extra-large
        );

        &.md-icon-button_selected {
          --md-icon-button-container-shape: calc(
            var(--md-icon-button-container-height) / 2
          );
        }
      }
      &.md-state_pressed {
        --md-icon-button-container-shape: var(--md-sys-shape-corner-large);
      }
    }
  }
}
</style>
