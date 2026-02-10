<script setup lang="ts">
import { computed, useTemplateRef, toRefs } from 'vue';
import {
  useLayoutSizeClass,
  LAYOUT_CLASS,
  LAYOUT_MIN_WIDTH,
} from './useLayoutSizeClass';
import { useElementBounding } from '@vueuse/core';
import { MDNavigationBar, MDNavigationRail } from '../Navigation';
import type { NavigationButton } from '../Navigation';
import { setupSplitLayoutContext } from './useSplitLayoutContext';
import { MDIconButton } from '../Button';
import { useAllowedBottomNavigation } from './allowedBottomNavigation';
import type { Pane } from './types';

const props = defineProps<{
  navigationButtons?: NavigationButton[];
  activeNavigationButton?: NavigationButton;
  hasMenuButton?: boolean;
  panes: Pane[];
}>();

const { navigationButtons } = toRefs(props);

const emit = defineEmits<{
  clickNavigation: [button: NavigationButton];
  clickBack: [];
}>();

defineSlots<{
  navigation: () => unknown;
  body: () => unknown;
}>();

const mainEl = useTemplateRef('mainEl');

const { layoutClass, layoutWidth } = useLayoutSizeClass(mainEl);

const bodyRef = useTemplateRef('bodyRef');

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

const { allowed: allowedBottomNavigation } = useAllowedBottomNavigation();

const showRailNavigation = computed(
  () =>
    navigationButtons.value?.length &&
    layoutWidth.value >= LAYOUT_MIN_WIDTH.medium,
);

const showBarNavigation = computed(
  () =>
    navigationButtons.value?.length &&
    layoutWidth.value < LAYOUT_MIN_WIDTH.medium &&
    allowedBottomNavigation.value,
);

const onClickNavigation = (button: NavigationButton) => {
  emit('clickNavigation', button);
};

const { left: bodyLeft, width: bodyWidth } = useElementBounding(bodyRef);

const onClickBack = () => {
  emit('clickBack');
};

const maxPanes = computed(() => {
  switch (layoutClass.value) {
    case LAYOUT_CLASS.expanded:
    case LAYOUT_CLASS.large:
    case LAYOUT_CLASS.extraLarge:
      return 2;

    case LAYOUT_CLASS.compact:
    case LAYOUT_CLASS.medium:
    default:
      return 1;
  }
});

const showPanes = computed(() =>
  props.panes.slice(0, maxPanes.value).toReversed(),
);

const numberOfPanes = computed(() => showPanes.value.length);

setupSplitLayoutContext({
  numberOfPanes,
  bodyLeft,
  bodyWidth,
});
</script>

<template>
  <main ref="mainEl" class="md md-layer" :class="[windowClassModifier]">
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
      <component
        :is="component"
        v-for="{ name, component, props: paneProps } in showPanes"
        :key="name"
        v-bind="paneProps"
      >
        <template #navigationButton>
          <MDIconButton
            tooltip="back"
            md-symbol-name="arrow_back"
            @click="onClickBack"
          />
        </template>
      </component>
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
