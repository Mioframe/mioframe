<script setup lang="ts">
import type { MaybeElement } from '@vueuse/core';
import { useElementBounding, useElementSize, useScroll } from '@vueuse/core';
import { isUndefined, round } from 'es-toolkit';
import type { StyleValue } from 'vue';
import { computed, ref, toRefs, useTemplateRef, watchEffect } from 'vue';
import { useOverlayContainer } from '../Overlay';
import { findClosestElement } from '@shared/lib/useClosestElement';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { usePaneScrollContainer } from '../Layout';

const props = withDefaults(
  defineProps<{
    type: 'docked' | 'floating';
    layout?: 'horizontal' | 'vertical' | undefined;
    color?: 'standard' | 'vibrant' | undefined;
    centerAligned?: boolean | undefined;
    autoHide?: boolean | undefined;
    autoHideTarget?: MaybeElement | undefined;
  }>(),
  { layout: 'horizontal', color: 'standard' },
);

defineSlots<{
  default: () => unknown;
}>();

const { autoHide, autoHideTarget } = toRefs(props);

const autoHideTargetEl = computed(() =>
  autoHide.value ? findClosestElement(autoHideTarget.value) : undefined,
);

const lastScrollDirection = ref<'top' | 'bottom'>();

const { directions } = useScroll(autoHideTargetEl);

watchEffect(() => {
  if (directions.top) {
    lastScrollDirection.value = 'top';
  } else if (directions.bottom) {
    lastScrollDirection.value = 'bottom';
  }
});

const show = computed(
  () =>
    !autoHide.value ||
    isUndefined(lastScrollDirection.value) ||
    lastScrollDirection.value === 'top',
);

const toolbarEl = useTemplateRef('toolbarEl');

const to = useOverlayContainer();

const { height: toolbarHeight, width: toolbarWidth } = useElementSize(
  toolbarEl,
  { height: 0, width: 0 },
  { box: 'border-box' },
);

const placeholderStyles = computed(
  (): StyleValue => ({
    height: `${toolbarHeight.value + 16}px`,
  }),
);

const paneContainerEl = usePaneScrollContainer();

const { left: paneContainerLeft, width: paneContainerWidth } = useElementBounding(paneContainerEl);

const paneContainerCenter = computed(() => paneContainerLeft.value + paneContainerWidth.value / 2);

const toolbarLeft = computed(() => round(paneContainerCenter.value - toolbarWidth.value / 2));

const toolbarStyle = computed((): StyleValue => {
  return {
    left: `${toolbarLeft.value}px`,
  };
});
</script>

<template>
  <div class="md-toolbar__placeholder" :style="placeholderStyles">
    <TeleportContainer :to="to" :container="toolbarEl">
      <div
        ref="toolbarEl"
        class="md-toolbar"
        :class="[
          `md-toolbar_type-${type}`,
          `md-toolbar_layout-${layout}`,
          `md-toolbar_color-${color}`,
          {
            'md-toolbar_center-aligned': centerAligned,
            'md-toolbar_auto-hide': autoHide,
            'md-toolbar_hide': !show,
          },
        ]"
        :style="toolbarStyle"
      >
        <div class="md-toolbar__container md">
          <slot />
        </div>
      </div>
    </TeleportContainer>
  </div>
</template>

<style lang="css" scoped>
.md-toolbar {
  --md-toolbar-container-color: unset;
  --md-toolbar-button-container-color: unset;
  --md-toolbar-selected-button-container-color: unset;
  --md-toolbar-icon-color: unset;
  --md-toolbar-icon-opacity: unset;
  --md-toolbar-selected-icon-color: unset;
  --md-toolbar-label-color: unset;
  --md-toolbar-label-opacity: unset;
  --md-toolbar-selected-label-color: unset;
  --md-toolbar-leading-padding: unset;
  --md-toolbar-trailing-padding: unset;
  --md-toolbar-min-space-between: unset;
  --md-toolbar-max-space-between: unset;
  --md-toolbar-container-gap: unset;
  --md-toolbar-container-shape: unset;
  --md-toolbar-container-justify-content: unset;
  --md-toolbar-margin-from-screen: unset;
  --md-toolbar-position: unset;
  --md-toolbar-container-height: unset;
  --md-toolbar-leading-space: unset;
  --md-toolbar-trailing-space: unset;
  --md-toolbar-space-between-actions: unset;
  --md-toolbar-container-elevation: unset;
  --md-toolbar-container-display: unset;
  --mt-toolbar-container-grow: unset;

  display: flex;
  justify-content: center;
  pointer-events: none;
  transform: translateY(0);
  transition-property: transform, opacity;
  transition-timing-function: var(var(--md-sys-motion-easing-emphasized-accelerate));
  transition-duration: var(--md-sys-motion-duration-short4);

  &_color {
    &-standard {
      --md-toolbar-container-color: var(--md-sys-color-surface-container);
      --md-toolbar-button-container-color: var(--md-sys-color-surface-container);
      --md-toolbar-selected-button-container-color: var(--md-sys-color-secondary-container);
      --md-toolbar-icon-color: var(--md-sys-color-on-surface-variant);
      --md-toolbar-selected-icon-color: var(--md-sys-color-on-secondary-container);
      --md-toolbar-label-color: var(--md-sys-color-on-surface-variant);
      --md-toolbar-selected-label-color: var(--md-sys-color-on-secondary-container);
      --md-toolbar-container-shape: var(--md-sys-shape-corner-full);
    }
    &-vibrant {
      --md-toolbar-container-color: var(--md-sys-color-primary-container);
      --md-toolbar-button-container-color: var(--md-sys-color-primary-container);
      --md-toolbar-selected-button-container-color: var(--md-sys-color-surface-container);
      --md-toolbar-icon-color: var(--md-sys-color-on-primary-container);
      --md-toolbar-icon-opacity: unset;
      --md-toolbar-selected-icon-color: var(--md-sys-color-on-surface);
      --md-toolbar-label-color: var(--md-sys-color-on-primary-container);
      --md-toolbar-label-opacity: unset;
      --md-toolbar-selected-label-color: var(--md-sys-color-on-surface);
      --md-toolbar-container-shape: var(--md-sys-shape-corner-full);
    }
  }

  &_center-aligned {
    --md-toolbar-min-space-between: 8dp;
    --md-toolbar-container-justify-content: center;
  }

  &_type {
    &-docked {
      --md-toolbar-container-height: 64dp;
      --md-toolbar-leading-padding: 16dp;
      --md-toolbar-trailing-padding: 16dp;
      --md-toolbar-max-space-between: 32dp;
      --md-toolbar-min-space-between: 4dp;
      --md-toolbar-container-shape: 0px 0px var(--md-pane-container-shape)
        var(--md-pane-container-shape);
      --mt-toolbar-container-grow: 1;
    }

    &-floating {
      position: fixed;
      bottom: 4step;

      --md-toolbar-min-space-between: 4dp;
      --md-toolbar-max-space-between: 4dp;
      --md-toolbar-container-justify-content: center;
      --md-toolbar-space-between-actions: 4dp;
      --md-toolbar-container-shape: var(--md-sys-shape-corner-full);
      --md-toolbar-container-elevation: var(--md-sys-elevation-level3);
      --md-toolbar-leading-padding: 8dp;
      --md-toolbar-trailing-padding: 8dp;
      --md-toolbar-container-display: inline-flex;
      --mt-toolbar-container-grow: 0;

      &.md-toolbar_layout-horizontal {
        --md-toolbar-container-height: 64dp;
        --md-toolbar-margin-from-screen: 16dp;
      }

      &.md-toolbar_layout-vertical {
        --md-toolbar-margin-from-screen: 24dp;
      }
    }
  }

  &__container {
    --md-container-color: var(--md-toolbar-container-color);
    --md-content-color: var(--md-toolbar-label-color);

    display: var(--md-toolbar-container-display, flex);
    height: var(--md-toolbar-container-height);
    align-items: center;
    padding-left: var(--md-toolbar-leading-padding);
    padding-right: var(--md-toolbar-trailing-padding);
    column-gap: var(--md-toolbar-max-space-between);

    justify-content: var(--md-toolbar-container-justify-content, space-between);
    margin-right: var(--md-toolbar-container-margin);
    margin-bottom: var(--md-toolbar-container-margin);
    margin-left: var(--md-toolbar-container-margin);
    flex-grow: var(--mt-toolbar-container-grow);

    border-radius: var(--md-toolbar-container-shape);
    box-shadow: var(--md-toolbar-container-elevation);

    pointer-events: all;
  }

  &__placeholder {
    width: 100%;
    flex-shrink: 0;
  }

  &_hide {
    opacity: 0;
    transform: translateY(100%) scale(0);
    pointer-events: none;
  }

  &.v {
    &-enter,
    &-leave {
      &-active {
        transition-property: transform, opacity;
      }
    }

    &-leave-active {
      transition-timing-function: var(var(--md-sys-motion-easing-emphasized-accelerate));
      transition-duration: var(--md-sys-motion-duration-short4);
    }

    &-enter-active {
      transition-timing-function: var(var(--md-sys-motion-easing-emphasized-decelerate));
      transition-duration: var(--md-sys-motion-duration-long2);
    }

    &-enter-from,
    &-leave-to {
      transform: translateY(calc(100vh - var(--teleport-placeholder-top) + 100%));
      &.md-toolbar__placeholder {
        height: 0;
      }
    }

    &-enter-to,
    &-leave-from {
      transform: translateY(0);
    }
  }
}
</style>
