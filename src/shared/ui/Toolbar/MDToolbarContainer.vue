<script setup lang="ts">
import { TeleportWithPlaceholder } from '@shared/lib/teleport';
import type { MaybeElement } from '@vueuse/core';
import { unrefElement, useParentElement, useScroll } from '@vueuse/core';
import { isUndefined } from 'es-toolkit';
import { computed, ref, toRefs, useTemplateRef, watchEffect } from 'vue';
import { usePaneContainer } from '../Layout/useMDContainer';

const props = withDefaults(
  defineProps<{
    type: 'docked' | 'floating';
    layout?: 'horizontal' | 'vertical';
    color?: 'standard' | 'vibrant';
    centerAligned?: boolean;
    autoHide?: boolean;
    autoHideTarget?: MaybeElement;
  }>(),
  { layout: 'horizontal', color: 'standard' },
);

const { autoHide, autoHideTarget } = toRefs(props);

defineSlots<{
  default: () => unknown;
}>();

const parentEl = useParentElement();

const autoHideTargetEl = computed(() =>
  autoHide.value ? (unrefElement(autoHideTarget) ?? parentEl.value) : undefined,
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

const paneContainer = usePaneContainer();

const to = computed(() => paneContainer.value ?? document.body);
</script>

<template>
  <TeleportWithPlaceholder
    :to="to"
    :container="toolbarEl"
    class="md-toolbar__placeholder"
    priority-height="content"
    priority-width="placeholder"
    with-placeholder
    :class="{
      'md-toolbar_auto-hide': autoHide,
    }"
  >
    <Transition>
      <div
        v-show="show"
        ref="toolbarEl"
        class="md-toolbar"
        :class="[
          `md-toolbar_type-${type}`,
          `md-toolbar_layout-${layout}`,
          `md-toolbar_color-${color}`,
          {
            'md-toolbar_center-aligned': centerAligned,
            'md-toolbar_auto-hide': autoHide,
          },
        ]"
      >
        <div class="md-toolbar__container md">
          <slot />
        </div>
      </div>
    </Transition>
  </TeleportWithPlaceholder>
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

  padding: 0 var(--md-toolbar-margin-from-screen)
    var(--md-toolbar-margin-from-screen) var(--md-toolbar-margin-from-screen);
  display: flex;
  justify-content: center;
  pointer-events: none;
  transform: translateY(0);

  &_color {
    &-standard {
      --md-toolbar-container-color: var(--md-sys-color-surface-container);
      --md-toolbar-button-container-color: var(
        --md-sys-color-surface-container
      );
      --md-toolbar-selected-button-container-color: var(
        --md-sys-color-secondary-container
      );
      --md-toolbar-icon-color: var(--md-sys-color-on-surface-variant);
      --md-toolbar-selected-icon-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-toolbar-label-color: var(--md-sys-color-on-surface-variant);
      --md-toolbar-selected-label-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-toolbar-container-shape: var(--md-sys-shape-corner-full);
    }
    &-vibrant {
      --md-toolbar-container-color: var(--md-sys-color-primary-container);
      --md-toolbar-button-container-color: var(
        --md-sys-color-primary-container
      );
      --md-toolbar-selected-button-container-color: var(
        --md-sys-color-surface-container
      );
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
    position: sticky;
    right: 0;
    bottom: 0;
    left: 0;
    margin-top: auto;
    width: 100%;
    flex-shrink: 0;
  }

  &_auto-hide {
    &.md-toolbar__placeholder {
      height: 0;
    }
    &.md-toolbar {
      position: absolute;
      bottom: 0;
      right: 0;
      left: 0;
    }
  }

  &.v {
    &-enter,
    &-leave {
      &-active {
        transition-property: transform, opacity;
      }
    }

    &-leave-active {
      transition-timing-function: var(
        var(--md-sys-motion-easing-emphasized-accelerate)
      );
      transition-duration: var(--md-sys-motion-duration-short4);
    }

    &-enter-active {
      transition-timing-function: var(
        var(--md-sys-motion-easing-emphasized-decelerate)
      );
      transition-duration: var(--md-sys-motion-duration-long2);
    }

    &-enter-from,
    &-leave-to {
      transform: translateY(
        calc(100vh - var(--teleport-placeholder-top) + 100%)
      );
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
