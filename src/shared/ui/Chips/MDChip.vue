<script setup lang="ts" generic="T extends 'assist' | 'filter' | 'input'">
import { MDIconButton } from '../Button';
import MDSymbol from '../Icon/MDSymbol.vue';
import { MDState } from '../State';

const { type: chipType, selected = false } = defineProps<{
  elevated?: boolean | undefined;
  label: string;
  type: T;
  selected?: (T extends 'filter' ? boolean : undefined) | undefined;
  draggable?: boolean | undefined;
  autofocus?: boolean | undefined;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
  clickClose: [event: MouseEvent];
}>();

const slots = defineSlots<{
  leadingIcon: T extends 'assist' ? () => unknown : undefined;
  trailingIcon: T extends 'filter' ? () => unknown : undefined;
}>();

const onClickClose = (e: MouseEvent) => {
  e.stopPropagation();
  emit('clickClose', e);
};

const onChipClick = (event: MouseEvent) => {
  event.stopPropagation();
  emit('click', event);
};
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
    :draggable="draggable"
    :autofocus="autofocus"
    @click="onChipClick"
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

    <MDIconButton
      v-if="chipType === 'input'"
      tooltip="remove"
      md-symbol-name="close"
      size="extra-small"
      class="md-chip__close-btn"
      @click="onClickClose"
    />

    <div v-else-if="chipType === 'filter' && !!slots.trailingIcon" class="md-chip__trailing-icon">
      <slot name="trailingIcon" />
    </div>
  </MDState>
</template>

<style lang="css" scoped>
.md-chip {
  position: relative;
  vertical-align: middle;
  cursor: pointer;
  flex-shrink: 0;
  --md-state-display: inline-flex;
  --md-state-align-items: center;
  --md-state-border-radius: var(--md-sys-shape-corner-small);
  --md-state-height: 32dp;
  --md-state-border-color: var(--md-sys-color-outline-variant);
  --md-state-border-width: 1dp;
  --md-state-border-style: solid;
  --md-state-padding-top: 0;
  --md-state-padding-right: 16px;
  --md-state-padding-bottom: 0;
  --md-state-padding-left: 16px;
  --md-state-min-width: 88dp;
  --md-content-color: var(--md-sys-color-on-surface);

  &__label-text {
    font-family: var(--md-sys-typescale-label-large-font);
    font-weight: var(--md-sys-typescale-label-large-weight);
    font-size: var(--md-sys-typescale-label-large-size);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-tracking);
    white-space: nowrap;
    flex: 1 0;

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
    min-height: 18dp;
    max-height: 30px;
    flex: 0 1;

    :deep() {
      > * {
        width: 100%;
        height: 100%;
        --md-symbol-size: 18dp;
      }

      .md-icon-button {
        --md-icon-button-icon-size: 18dp;
        --md-icon-button-padding: 0px;
      }
    }

    .md-chip_disabled &,
    .md-chip:disabled & {
      --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    }
  }

  &__close-btn {
    margin-right: -16px;
    --md-target-width: 48px;
    --md-target-height: 48px;
  }

  &__leading-icon {
    margin-left: -8px;
  }

  &__trailing-icon {
    margin-left: 8px;
    margin-right: -8px;
  }

  &_elevated {
    z-index: 1;
    --md-state-box-shadow: var(--md-sys-elevation-level1);
    --md-container-color: var(--md-sys-color-surface-container-low);

    &.md-chip_disabled,
    &:disabled {
      --md-state-box-shadow: var(--md-sys-elevation-level0);
      --md-container-color: rgb(from var(--md-sys-color-on-surface) / r g b 0.12);
    }

    &:hover {
      --md-state-box-shadow: var(--md-sys-elevation-level2);
    }
  }

  &_filter {
    /* --md-content-color: var(--md-sys-color-on-surface-variant); */

    &.md-chip_selected {
      --md-content-color: var(--md-sys-color-on-secondary-container);
      --md-container-color: var(--md-sys-color-secondary-container);
      --md-state-border-color: var(--md-sys-color-secondary-container);
      --md-state-border-width: 0;
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

  &.md-state_hover {
    --md-content-color: var(--md-sys-color-on-surface);
  }

  &_disabled,
  :disabled {
    --md-content-color: rgb(var(--md-sys-color-on-surface) / r g b 0.38);
    pointer-events: none;
    --md-state-border-color: rgb(from var(--md-sys-color-on-surface) / r g b 0.12);
    --md-state-box-shadow: var(--md-sys-elevation-level0);
  }
}
</style>
