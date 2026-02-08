<script setup lang="ts" generic="NB extends NavigationButton">
import { computed, watchEffect, useTemplateRef, toRefs } from 'vue';
import {
  useLayoutSizeClass,
  LAYOUT_CLASS,
  LAYOUT_MIN_WIDTH,
} from './useLayoutSizeClass';
import { useCssVar, useElementBounding } from '@vueuse/core';
import { MDNavigationBar, MDNavigationRail } from '../Navigation';
import type { NavigationButton } from '../Navigation';
import { setupSplitLayout } from './useSplitLayout';

const props = defineProps<{
  navigationButtons?: NB[];
  activeNavigationButton?: NB;
  hasMenuButton?: boolean;
  numberOfPanes: number;
}>();

const { numberOfPanes } = toRefs(props);

const emit = defineEmits<{
  clickNavigation: [button: NB];
}>();

defineSlots<{
  navigation: () => unknown;
  body: () => unknown;
}>();

const el = useTemplateRef('el');

const { layoutClass, layoutWidth } = useLayoutSizeClass(el);

const isShowFirstPane = computed(
  () => layoutClass.value !== LAYOUT_CLASS.compact,
);

const firstPaneSize = computed((): number => {
  if (isShowFirstPane.value) {
    if (layoutClass.value === LAYOUT_CLASS.medium) {
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
    case LAYOUT_CLASS.compact:
      return 'md-layer_compact';
    case LAYOUT_CLASS.medium:
      return 'md-layer_medium';
    case LAYOUT_CLASS.expanded:
      return 'md-layer_expanded';
    case LAYOUT_CLASS.large:
      return 'md-layer_large';
    case LAYOUT_CLASS.extraLarge:
      return 'md-layer_extra-large';
    default:
      return undefined;
  }
});

const showRailNavigation = computed(
  () =>
    props.navigationButtons?.length &&
    layoutWidth.value >= LAYOUT_MIN_WIDTH.medium,
);

const showBarNavigation = computed(
  () =>
    props.navigationButtons?.length &&
    layoutWidth.value < LAYOUT_MIN_WIDTH.medium,
);

const onClickNavigation = (button: NB) => {
  emit('clickNavigation', button);
};

const { left: bodyLeft, width: bodyWidth } = useElementBounding(bodyRef);

setupSplitLayout({
  numberOfPanes,
  bodyLeft,
  bodyWidth,
});
</script>

<template>
  <main ref="el" class="md md-layer" :class="[windowClassModifier]">
    <MDNavigationRail
      v-if="navigationButtons && showRailNavigation"
      :buttons="navigationButtons"
      class="md-layer__navigation-rail"
      :has-menu="hasMenuButton"
      :active="activeNavigationButton"
      @click="onClickNavigation"
    />

    <MDNavigationBar
      v-else-if="navigationButtons && showBarNavigation"
      :buttons="navigationButtons"
      :active="activeNavigationButton"
      class="md-layer__navigation-bar"
      @click="onClickNavigation"
    />

    <section ref="bodyRef" class="md-layer__body body">
      <slot name="body" />
    </section>
  </main>
</template>

<style scoped>
.md-layer {
  flex-grow: 1;
  height: 100%;
  overflow: auto;
  --md-container-color: var(--md-sys-color-surface-container);
  --md-content-color: var(--md-sys-color-on-surface);

  display: grid;
  grid-template:
    'rail body' auto
    'bar bar' min-content / min-content 1fr;

  &__navigation {
    &-rail {
      grid-area: rail;
    }
    &-bar {
      grid-area: bar;
      z-index: 1;
    }
  }

  &__body {
    flex-grow: 1;
    flex-shrink: 0;
    max-height: 100%;
    grid-area: body;

    container: layer / size;
    /* fix floating-ui https://github.com/floating-ui/floating-ui/issues/3067 */
    contain: layout;
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
