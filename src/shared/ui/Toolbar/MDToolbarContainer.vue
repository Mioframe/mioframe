<script setup lang="ts">
import { TeleportWithPlaceholder } from '@shared/lib/teleport';
import { toRefs } from 'vue';

const props = withDefaults(
  defineProps<{
    type: 'docked' | 'floating';
    layout?: 'horizontal' | 'vertical';
    color?: 'standard' | 'vibrant';
    centerAligned?: boolean;
  }>(),
  { layout: 'horizontal', color: 'standard' },
);

const {} = toRefs(props);

defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <TeleportWithPlaceholder
    class="md-toolbar__placeholder"
    priority-height="content"
    priority-width="placeholder"
  >
    <div
      class="md-toolbar"
      :class="[
        `md-toolbar_type-${type}`,
        `md-toolbar_layout-${layout}`,
        `md-toolbar_color-${color}`,
        { 'md-toolbar_center-aligned': centerAligned },
      ]"
    >
      <div class="md-toolbar__container md">
        <slot />
      </div>
    </div>
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
  }

  &__placeholder {
    position: sticky;
    bottom: 0;
  }
}
</style>
