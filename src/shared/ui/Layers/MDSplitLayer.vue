<script setup lang="ts">
import { computed, watchEffect, useTemplateRef } from 'vue';
import { useWindowSizeClass, WindowClass } from './useWindowSizeClass';
import { useCssVar } from '@vueuse/core';
import { SPLIT_VIEW } from './config';

const slots = defineSlots<{
  navigation: () => unknown;
  [SPLIT_VIEW.second]: () => unknown;
  [SPLIT_VIEW.main]: (p: { splitView: boolean }) => unknown;
}>();

const { windowClass } = useWindowSizeClass();

const isShowFirstPane = computed(
  () => windowClass.value !== WindowClass.Compact,
);

const firstPaneSize = computed((): number => {
  if (isShowFirstPane.value) {
    if (windowClass.value === WindowClass.Medium) {
      return 50;
    }
    return 30;
  }
  return 0;
});

const bodyRef = useTemplateRef('bodyRef');

const firstPaneSizeCssVar = useCssVar('--md-first-pane-width', bodyRef);
const secondPaneSizeCssVar = useCssVar('--md-main-pane-width', bodyRef);

watchEffect(() => {
  firstPaneSizeCssVar.value = `${firstPaneSize.value}%`;
});
watchEffect(() => {
  secondPaneSizeCssVar.value = `${100 - firstPaneSize.value}%`;
});

const windowClassModifier = computed(() => {
  switch (windowClass.value) {
    case WindowClass.Compact:
      return 'md-layer_compact';
    case WindowClass.Medium:
      return 'md-layer_medium';
    case WindowClass.Expanded:
      return 'md-layer_expanded';
    case WindowClass.Large:
      return 'md-layer_large';
    case WindowClass.ExtraLarge:
      return 'md-layer_extra-large';
    default:
      return undefined;
  }
});
</script>

<template>
  <main class="md md-layer" :class="[windowClassModifier]">
    <nav v-if="!!slots.navigation" class="md-layer__navigation">
      <slot name="navigation" />
    </nav>

    <section ref="bodyRef" class="md-layer__body body">
      <div v-if="isShowFirstPane" class="body__first-pane">
        <slot :name="SPLIT_VIEW.second" />
      </div>

      <div class="body__main-pane">
        <slot :name="SPLIT_VIEW.main" :split-view="isShowFirstPane" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.md-layer {
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
  overflow: auto;
  --md-container-color: var(--md-sys-color-surface-container);
  --md-content-color: var(--md-sys-color-on-surface);

  &__navigation {
    flex-grow: 1;
    flex-shrink: 0;
  }

  &__body {
    flex-grow: 1;
    flex-shrink: 0;
    max-height: 100%;
  }
}

.body {
  display: flex;

  &__main-pane,
  &__first-pane {
    --md-pane-padding: 16px;

    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 4px var(--md-pane-padding);
    overflow-y: auto;
    transition: none;

    .md-layer_compact & {
      --md-pane-padding: 0px;
      --md-pane-container-shape: 0px;
      padding: 0 var(--md-pane-padding);
    }
  }

  &__first-pane {
    flex-basis: var(--md-first-pane-width, auto);

    &:empty {
      --md-first-pane-width: 0px;
      display: none;
    }
  }

  &__main-pane {
    flex-basis: var(--md-main-pane-width, auto);
  }

  &__container {
    position: relative;
    flex: 1 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: 16px;
    --md-container-color: var(--md-sys-color-surface);
    --md-content-color: var(--md-sys-color-on-surface);
    overflow-y: auto;
  }
}
</style>
