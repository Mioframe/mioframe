<script setup lang="ts" generic="T extends 'assist' | 'filter' | 'input'">
import MDSymbol from '../Icon/MDSymbol.vue';
import { MDState } from '../State';

const { type: chipType, selected = false } = defineProps<{
  elevated?: boolean;
  label: string;
  type: T;
  selected?: T extends 'filter' ? boolean : undefined;
}>();

const slots = defineSlots<{
  leadingIcon: T extends 'assist' ? () => unknown : undefined;
  trailingIcon: T extends 'filter' ? () => unknown : undefined;
}>();
</script>

<template>
  <MDState
    is="button"
    class="md-chip"
    :class="[
      `md-chip_${chipType}`,
      {
        'md-chip_elevated': elevated,
        'md-chip_selected': selected,
      },
    ]"
    type="button"
  >
    <div
      v-if="!!slots.leadingIcon || (chipType === 'filter' && selected)"
      class="md-chip__leading-icon"
    >
      <MDSymbol v-if="chipType === 'filter' && selected" name="check" />

      <slot v-else name="leadingIcon" />
    </div>

    <span class="md-chip__label-text">
      {{ label }}
    </span>

    <div
      v-if="!!slots.trailingIcon || chipType === 'input'"
      class="md-chip__trailing-icon"
    >
      <MDSymbol v-if="chipType === 'input'" name="close" />

      <slot v-else name="trailingIcon" />
    </div>
  </MDState>
</template>

<style lang="css" scoped>
.md-chip {
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
  --md-content-color: var(--md-sys-color-on-surface);

  &__label-text {
    font-family: var(--md-sys-typescale-label-large-font);
    font-weight: var(--md-sys-typescale-label-large-weight);
    font-size: var(--md-sys-typescale-label-large-size);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-tracking);
    white-space: nowrap;

    .md-chip__leading-icon + & {
      margin-left: 8px;
    }
  }

  &__leading-icon,
  &__trailing-icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 18dp;
    height: 18dp;

    :deep(> *) {
      width: 100%;
      height: 100%;
      --md-symbol-size: 18px;
    }

    .md-chip_disabled &,
    .md-chip:disabled & {
      --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    }
  }

  &__leading-icon {
    margin-left: -8px;
  }

  &__trailing-icon {
    margin-left: 8px;
    margin-right: -8px;
  }

  &_elevated {
    box-shadow: var(--md-sys-elevation-level1);
    z-index: 1;
    --md-container-color: var(--md-sys-color-surface-container-low);

    &.md-chip_disabled,
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
    /* --md-content-color: var(--md-sys-color-on-surface-variant); */

    &.md-chip_selected {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-container-color: var(--md-sys-color-secondary-container);
      border-color: var(--md-sys-color-secondary-container);
      border-width: 0;
    }

    &.md-chip_elevated {
      --md-container-color: var(--md-sys-color-surface-container-low);

      &.md-chip_selected {
        --md-container-color: var(--md-sys-color-secondary-container);
      }
    }
  }

  &_assist {
    .md-chip__leading-icon,
    .md-chip__trailing-icon {
      --md-content-color: var(--md-sys-color-primary);
    }
  }

  &.md-state_hover,
  &:hover {
    --md-content-color: var(--md-sys-color-on-surface);
  }

  &_disabled,
  :disabled {
    --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    pointer-events: none;
    border-color: rgb(from var(--md-sys-color-on-surface) / r g b 0.12);
    box-shadow: var(--md-sys-elevation-level0);
  }
}
</style>
