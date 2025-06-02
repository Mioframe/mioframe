<script setup lang="ts" generic="T extends ButtonDescription">
import { computed } from 'vue';
import { MDSymbol } from '../Icon';
import type { ButtonDescription } from './types';
import { isArray } from 'remeda';

const { elevation, enable } = defineProps<{
  buttons: Iterable<T>;
  enable?: T[] | T;
  elevation?: boolean;
}>();

defineSlots<{
  icon(p: { item: T }): unknown;
}>();

const emit = defineEmits<{
  click: [item: T];
}>();

const enableList = computed(() => (isArray(enable) ? enable : [enable]));
</script>

<template>
  <div
    class="md md-buttons-bar"
    :class="{
      'md-button-bar_elevation': elevation,
    }"
  >
    <button
      v-for="(item, itemIndex) in buttons"
      :key="itemIndex"
      type="button"
      class="md-buttons-bar__item md item"
      :class="{
        item_enable: enableList?.includes(item),
      }"
      @click="emit('click', item)"
    >
      <div class="item__icon">
        <slot name="icon" :item>
          <MDSymbol :name="item.iconName ?? 'fiber_manual_record'" />
        </slot>
      </div>

      <span class="item__label">
        {{ item.label }}
      </span>
    </button>
  </div>
</template>

<style lang="css" scoped>
.md-buttons-bar {
  display: flex;
  height: 80dp;
  width: 100%;
  gap: 8dp;

  &_elevation {
    box-shadow: var(--md-sys-elevation-level2);
  }
}

.item {
  font-family: var(--md-sys-typescale-label-medium-font);
  line-height: var(--md-sys-typescale-label-medium-line-height);
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-label-medium-weight);
  --md-content-color: var(md-sys-color-on-surface);
  padding: 12dp 0 16dp;
  border: 0;
  min-width: 48dp;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  border-radius: 12dp;

  &_active {
    font-weight: var(--md-sys-typescale-label-medium-weight-prominent);
    letter-spacing: var(--md-sys-typescale-label-medium-tracking);
  }

  &__icon {
    width: 24dp;
    height: 24dp;
    position: relative;
    z-index: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    &::before {
      content: '';
      position: absolute;
      width: 64dp;
      height: 32dp;
      border-radius: 16dp;
      background: transparent;
      z-index: 0;
    }

    :deep() {
      > * {
        position: relative;
        z-index: 1;
      }
    }
  }

  &__label {
    margin-top: 4dp;
  }

  &_enable {
    .item__icon {
      &:before {
        background-color: var(--md-sys-color-secondary-container);
      }
    }
  }
}
</style>
