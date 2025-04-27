<script setup lang="ts" generic="T extends 'assist' | 'filter'">
import { vPressedState } from '@shared/lib/md/stateHelper';
import MDSymbol from '../Icon/MDSymbol.vue';

const { type: chipType, selected = false } = defineProps<{
  elevated?: boolean;
  label: string;
  type: T;
  selected?: T extends 'filter' ? boolean : undefined;
}>();

const slots = defineSlots<{
  leadingIcon: () => unknown;
  trailingIcon: T extends 'filter' ? () => unknown : undefined;
}>();
</script>

<template>
  <button
    v-pressed-state
    class="md-assist-chip"
    :class="[
      `md-assist-chip_${chipType}`,
      {
        'md-assist-chip_elevated': elevated,
        'md-assist-chip_selected': selected,
      },
    ]"
    type="button"
  >
    <div
      v-if="!!slots.leadingIcon || (chipType === 'filter' && selected)"
      class="md-assist-chip__leading-icon"
    >
      <MDSymbol v-if="chipType === 'filter' && selected" name="check" />

      <slot v-else name="leadingIcon" />
    </div>

    <span class="md-assist-chip__label-text">
      {{ label }}
    </span>
  </button>
</template>

<style lang="css" scoped>
.md-assist-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: var(--md-sys-shape-corner-small);
  height: 32dp;
  border-color: var(--md-sys-color-outline-variant);
  border-width: 1dp;
  border-style: solid;
  padding: 0 16px;
  cursor: pointer;
  flex-shrink: 0;

  &_elevated {
    box-shadow: var(--md-sys-elevation-level1);
    z-index: 1;
    --md-container-color: var(--md-sys-color-surface-container-low);

    &.md-assist-chip_disabled,
    &:disabled {
      box-shadow: var(--md-sys-elevation-level0);
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) / r g b 0.12
      );
    }

    &:hover {
      box-shadow: var(--md-sys-elevation-level2);
    }
  }

  &_filter {
    &.md-assist-chip_selected {
      --md-container-color: var(--md-sys-color-secondary-container);
      border-color: var(--md-sys-color-secondary-container);
      border-width: 0;
    }

    &.md-assist-chip_elevated {
      --md-container-color: var(--md-sys-color-surface-container-low);

      &.md-assist-chip_selected {
        --md-container-color: var(--md-sys-color-secondary-container);
      }
    }
  }

  &_disabled,
  :disabled {
    pointer-events: none;
    border-color: rgb(from var(--md-sys-color-on-surface) / r g b 0.12);
    box-shadow: var(--md-sys-elevation-level0);
  }

  &__label-text {
    font-family: var(--md-sys-typescale-label-large-font);
    font-weight: var(--md-sys-typescale-label-large-weight);
    font-size: var(--md-sys-typescale-label-large-size);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-tracking);
    --md-content-color: var(--md-sys-color-on-surface);
    white-space: nowrap;
    --md-container-color: transparent;

    .md-assist-chip__leading-icon + & {
      margin-left: 8px;
    }

    .md-assist-chip_filter & {
      --md-content-color: var(--md-sys-color-on-surface-variant);
    }
    .md-assist-chip_filter.md-assist-chip_selected & {
      --md-content-color: var(--md-sys-color-on-secondary-container);
    }

    .md-assist-chip_disabled &,
    .md-assist-chip:disabled & {
      --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    }

    .md-assist-chip:hover & {
      --md-content-color: var(--md-sys-color-on-surface);
    }
  }

  &__leading-icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 18dp;
    height: 18dp;
    --md-content-color: var(--md-sys-color-primary);
    --md-container-color: transparent;

    margin-left: -8px;

    :deep(> *) {
      width: 100%;
      height: 100%;
      --md-symbol-size: 18px;
    }

    .md-assist-chip_filter & {
      --md-content-color: var(--md-sys-color-primary);
    }

    .md-assist-chip_filter.md-assist-chip_selected & {
      --md-content-color: var(--md-sys-color-on-secondary-container);
    }

    .md-assist-chip_disabled &,
    .md-assist-chip:disabled & {
      --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    }
  }

  /*   &__trailing-icon {
    display: none;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 18dp;
    height: 18dp;
    margin-right: -8px;
    --md-content-color: var(--md-sys-color-on-surface-variant);
    --md-container-color: transparent;

    :deep(> *) {
      width: 100%;
      height: 100%;
      --md-symbol-size: 18px;
    }

    .md-assist-chip_filter & {
      display: block;
    }

    .md-assist-chip_selected & {
      --md-content-color: var(--md-sys-color-on-secondary-container);
    }

    .md-assist-chip_selected.md-assist-chip_opened-menu & {
      transform: rotateZ(180deg);
    }

    .md-assist-chip_disabled &,
    .md-assist-chip:disabled & {
      --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    }
  }
 */
}
</style>
