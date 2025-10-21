<script setup lang="ts">
import { computed, watchEffect, useTemplateRef } from 'vue';
import { useLayoutSizeClass, LayoutClass } from './useLayoutSizeClass';
import { useCssVar } from '@vueuse/core';
import { SPLIT_VIEW } from './config';

const slots = defineSlots<{
  navigation: () => unknown;
  [SPLIT_VIEW.second]: () => unknown;
  [SPLIT_VIEW.main]: (p: { splitView: boolean }) => unknown;
}>();

const el = useTemplateRef('el');

const { layoutClass } = useLayoutSizeClass(el);

const isShowFirstPane = computed(
  () => layoutClass.value !== LayoutClass.Compact,
);

const firstPaneSize = computed((): number => {
  if (isShowFirstPane.value) {
    if (layoutClass.value === LayoutClass.Medium) {
      return 50;
    }
    return 30;
  }
  return 0;
});

const bodyRef = useTemplateRef('bodyRef');

const firstPaneSizeCssVar = useCssVar('--md-first-pane-width', bodyRef);

watchEffect(() => {
  firstPaneSizeCssVar.value = `${firstPaneSize.value}cqw`;
});

const windowClassModifier = computed(() => {
  switch (layoutClass.value) {
    case LayoutClass.Compact:
      return 'md-layer_compact';
    case LayoutClass.Medium:
      return 'md-layer_medium';
    case LayoutClass.Expanded:
      return 'md-layer_expanded';
    case LayoutClass.Large:
      return 'md-layer_large';
    case LayoutClass.ExtraLarge:
      return 'md-layer_extra-large';
    default:
      return undefined;
  }
});
</script>

<template>
  <main ref="el" class="md md-layer" :class="[windowClassModifier]">
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
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  overflow: auto;
  --md-container-color: var(--md-sys-color-surface-container);
  --md-content-color: var(--md-sys-color-on-surface);
  container: layer / size;

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
    --md-pane-margin-x: 16px;
    --md-pane-margin-y: 4px;

    display: flex;
    flex-direction: column;
    position: relative;

    width: var(--md-pane-width);

    padding: var(--md-pane-margin-y) var(--md-pane-margin-x);
    box-sizing: border-box;
    overflow-y: auto;
    transition: none;

    .md-layer_compact & {
      --md-pane-margin-x: 0px;
      --md-pane-margin-y: 0px;
      --md-pane-container-shape: 0px;
      --md-pane-padding-x: 4px;
    }
  }

  &__first-pane {
    --md-pane-width: var(--md-first-pane-width);
    min-width: var(--md-pane-width);

    &:empty {
      --md-pane-width: 0px;
      display: none;
    }
  }

  &__main-pane {
    --md-pane-width: 100cqw;
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
