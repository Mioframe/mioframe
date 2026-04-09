<script setup lang="ts">
import { useLastHover } from '@shared/lib/useLastHover';
import { MDSymbol } from '../../Icon';
import { MDLayer, usePressed, useRipple } from '../../State';
import { computed, useTemplateRef } from 'vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { BUTTON_TYPE } from './types';

const props = defineProps<{
  symbol: string;
  label: string;
  active?: boolean | undefined;
  type: BUTTON_TYPE;
  hasRipple?: boolean | undefined;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();

const refEl = useTemplateRef('refEl');

const userHover = useLastHover(refEl);

const { focused: userFocused } = useFirstFocus(refEl, {
  useTarget: true,
  focusVisible: true,
});

const { durationPressedState } = usePressed(refEl);

useRipple(computed(() => (props.hasRipple ? refEl.value : undefined)));

const horizontal = computed(() => props.type === BUTTON_TYPE.railHorizontal);
</script>

<template>
  <button
    ref="refEl"
    type="button"
    class="md-navigation-rail-button md"
    :class="[
      {
        _active: active,
      },
      `_type-${type}`,
    ]"
  >
    <MDLayer
      v-if="horizontal"
      class="md-navigation-rail-button__layer"
      :hover="userHover"
      :focused="userFocused"
      :pressed="durationPressedState"
    />

    <div class="md-navigation-rail-button__symbol-container">
      <MDLayer
        v-if="type === BUTTON_TYPE.vertical"
        class="md-navigation-rail-button__layer"
        :hover="userHover"
        :focused="userFocused"
        :pressed="durationPressedState"
      />

      <MDSymbol class="md-navigation-rail-button__symbol" :name="symbol" />
    </div>

    <span class="md-navigation-rail-button__label">
      {{ label }}
    </span>
  </button>
</template>

<style lang="css" scoped>
.md-navigation-rail-button {
  padding: 0;
  border: 0;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  transition-property: background-color;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: var(--md-sys-shape-corner-small);
  --md-content-color: var(--md-sys-color-on-surface-variant);

  * {
    transition-property: none;
  }

  &__symbol-container {
    --md-symbol-size: 24px;
    border-radius: var(--md-sys-shape-corner-full);
    --md-content-color: var(--md-sys-color-on-surface-variant);

    padding: 4px 16px;
    position: relative;
  }

  &__symbol {
    transition-property: font-variation-settings;
  }

  &__layer {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  &__label {
    margin-top: 4px;
    padding-bottom: 6px;
    text-align: center;
    font-family: var(--md-ref-typeface-plain);
    font-weight: var(--md-ref-typeface-weight-medium);
    font-size: 12pt;
    line-height: 16pt;
    letter-spacing: 0.5pt;
  }

  &._active {
    --md-content-color: var(--md-sys-color-secondary);

    .md-navigation-rail-button__symbol {
      --md-symbol-fill: 1;
    }
  }

  &._type-vertical {
    &._active {
      .md-navigation-rail-button__symbol-container {
        background-color: var(--md-sys-color-secondary-container);
        --md-content-color: var(--md-sys-color-on-secondary-container);
      }
    }
  }

  &._type-rail-horizontal {
    flex-direction: row;
    border-radius: var(--md-sys-shape-corner-full);
    align-items: center;
    .md-navigation-rail-button__symbol-container {
      padding: 0;
      margin: 0;
    }

    &._active {
      --md-container-color: var(--md-sys-color-secondary-container);
      --md-content-color: var(--md-sys-color-on-secondary-container);
    }
  }

  &._type-rail-horizontal {
    padding: 16px;

    .md-navigation-rail-button__label {
      padding: 0;
      margin: 0 0 0 8px;
      font-size: 14pt;
      line-height: 20pt;
      letter-spacing: 0.1pt;
    }
  }
}
</style>
