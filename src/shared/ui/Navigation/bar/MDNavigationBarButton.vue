<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { MDSymbol } from '../../Icon';
import { MDLayer, usePressed, useRipple } from '../../State';
import { useLastHover } from '@shared/lib/useLastHover';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import type { BAR_TYPE } from './types';

defineProps<{
  label: string;
  symbol: string;
  active?: boolean;
  type?: BAR_TYPE;
}>();

const el = useTemplateRef('el');

useRipple(el);

const userHover = useLastHover(el);

const { focused: userFocused } = useFirstFocus(el, {
  useTarget: true,
  focusVisible: true,
});

const { durationPressedState } = usePressed(el);
</script>

<template>
  <button
    ref="el"
    class="md-navigation-bar-button md"
    type="button"
    :class="[{ _active: active }, `_type-${type}`]"
  >
    <MDLayer
      class="md-navigation-bar-button__layer"
      :hover="userHover"
      :focused="userFocused"
      :pressed="durationPressedState"
    />

    <MDSymbol class="md-navigation-bar-button__symbol" :name="symbol" />

    <span class="md-navigation-bar-button__label">
      {{ label }}
    </span>
  </button>
</template>

<style lang="css" scoped>
.md-navigation-bar-button {
  display: flex;
  flex-direction: column;
  border: 0;
  padding: 6px 0;
  position: relative;
  border-radius: 1step;
  align-items: center;
  justify-items: center;
  --md-content-color: var(--md-sys-color-on-surface-variant);
  gap: 4px;

  &__layer {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  &__symbol {
    position: relative;
    z-index: 1;
    padding: 4px 16px;
    width: auto;
    height: auto;
    border-radius: var(--md-sys-shape-corner-full);
    --md-symbol-size: 24px;
  }

  &__label {
    position: relative;
    z-index: 1;
    font-family: var(--md-ref-typeface-plain);
    font-weight: var(--md-ref-typeface-weight-medium);
    font-size: 12pt;
    line-height: 16pt;
    letter-spacing: 0.5pt;
  }

  &._type {
    &-horizontal {
      flex-direction: row;
      padding: 8px 16px;
      border-radius: var(--md-sys-shape-corner-full);

      .md-navigation-bar-button__symbol {
        padding: 0;
      }
    }
  }

  &._active {
    --md-content-color: var(--md-sys-color-secondary);

    .md-navigation-bar-button__symbol {
      --md-symbol-fill: 1;
      --md-content-color: var(--md-sys-color-on-secondary-container);
    }

    &._type-vertical {
      .md-navigation-bar-button__symbol {
        background-color: var(--md-sys-color-secondary-container);
      }
    }

    &._type-horizontal {
      background-color: var(--md-sys-color-secondary-container);
    }
  }
}
</style>
