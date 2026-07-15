<script setup lang="ts">
import type { StyleValue } from 'vue';
import { computed, useTemplateRef, toRefs } from 'vue';
import { useLayoutSizeClass, LAYOUT_CLASS, LAYOUT_MIN_WIDTH } from './useLayoutSizeClass';
import { useElementBounding } from '@vueuse/core';
import { MDNavigationBar, MDNavigationRail } from '../Navigation';
import type { NavigationButton } from '../Navigation';
import { setupSplitLayoutContext } from './useSplitLayoutContext';
import { MDIconButton } from '../Button';
import { useAllowedBottomNavigation } from './allowedBottomNavigation';
import type { Pane } from './types';
import { isNumber } from 'es-toolkit';
import { useLocalSettings } from '@entity/localSettings';
import PaneContextWrap from './PaneContextWrap.vue';
import { usePaneResize } from './usePaneResize';

const props = defineProps<{
  navigationButtons?: NavigationButton[] | undefined;
  activeNavigationButton?: NavigationButton | undefined;
  hasMenuButton?: boolean | undefined;
  panes: Pane[];
}>();

const emit = defineEmits<{
  clickNavigation: [button: NavigationButton];
  clickBack: [];
}>();

defineSlots<{
  navigation: () => unknown;
  body: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { navigationButtons } = toRefs(props);

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
  () => navigationButtons.value?.length && layoutWidth.value >= LAYOUT_MIN_WIDTH.medium,
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

const showPanes = computed(() => props.panes.slice(0, maxPanes.value).toReversed());

const numberOfPanes = computed(() => showPanes.value.length);

setupSplitLayoutContext({
  numberOfPanes,
  bodyLeft,
  bodyWidth,
});

const { settings } = useLocalSettings();

const panesWidth = computed(() => settings.value.panesWidth);

const {
  activeResizePaneIndex,
  onResizePointerDown,
  onResizePointerEnd,
  onResizeLostPointerCapture,
  onBodyPointerMove,
} = usePaneResize({
  panesWidth,
  bodyLeft,
  bodyWidth,
});

const bodyStyle = computed(
  (): StyleValue =>
    numberOfPanes.value > 0 &&
    panesWidth.value.reduce<Record<string, string>>((style, width, index) => {
      if (isNumber(width)) {
        style[`--pane-${index + 1}-width`] = `${width}px`;
      }
      return style;
    }, {}),
);
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

    <section
      ref="bodyRef"
      class="md-layer__body body"
      :style="bodyStyle"
      @pointermove="onBodyPointerMove"
    >
      <!-- reverse the index, since showPanes is reversed -->
      <PaneContextWrap
        v-for="({ name, component, props: paneProps }, paneIndex) in showPanes"
        :key="name"
        :name="name"
        :index="showPanes.length - 1 - paneIndex"
      >
        <component :is="component" v-bind="paneProps" class="body__pane">
          <template #navigationButton>
            <MDIconButton
              tooltip="back"
              md-symbol-name="arrow_back"
              color="standard"
              @click="onClickBack"
            />
          </template>

          <template v-if="showPanes.length - 1 - paneIndex === 0" #appBarTrailing>
            <slot name="appBarTrailing" />
          </template>
        </component>

        <button
          v-if="paneIndex < showPanes.length - 1"
          class="__resize-button"
          :class="{
            _active: activeResizePaneIndex === paneIndex,
          }"
          type="button"
          aria-label="resize pane"
          @pointerdown="onResizePointerDown(paneIndex, $event)"
          @pointerup="onResizePointerEnd"
          @pointercancel="onResizePointerEnd"
          @lostpointercapture="onResizeLostPointerCapture"
        />
      </PaneContextWrap>
    </section>
  </main>
</template>

<style scoped>
.md-layer {
  flex-grow: 1;
  height: 100svh;
  max-height: 100svh;
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

  .__resize-button {
    --button-height: 8step;
    --button-width: 1step;
    --trigger-offset: 6step;
    position: relative;
    z-index: 1;
    display: flex;
    height: 100%;
    width: 0;
    padding: 0;
    background: transparent;
    border: 0;
    touch-action: none;

    &::before {
      content: '';
      display: block;
      height: calc(var(--button-height) + var(--trigger-offset));
      width: calc(var(--button-width) + var(--trigger-offset));
      cursor: col-resize;
      position: absolute;
      top: calc(50% - (var(--button-height) + var(--trigger-offset)) / 2);
      left: calc((var(--button-width) + var(--trigger-offset)) / -2);
    }

    &::after {
      content: '';
      display: block;
      flex-grow: 1;
      border-radius: var(--md-sys-shape-corner-full);
      background-color: var(--md-sys-color-on-surface-variant);
      height: var(--button-height);
      width: var(--button-width);
      pointer-events: none;
      position: absolute;
      top: calc(50% - var(--button-height) / 2);
      left: calc(var(--button-width) / -2);
      transition-property: background-color, height, width, top, left;
      transition-duration: var(--md-sys-motion-duration-short2);
    }

    &._active,
    &:hover {
      &::after {
        background-color: var(--md-content-color);

        height: calc(var(--button-height) + 5step);
        width: calc(var(--button-width) + 1step);
        top: calc(50% - (var(--button-height) + 5step) / 2);
        left: calc((var(--button-width) + 1step) / -2);
      }
    }
  }
}

.body {
  display: flex;

  &__pane {
    &:nth-of-type(1) {
      width: var(--pane-1-width);
      max-width: var(--pane-1-width);
    }
    &:nth-of-type(2) {
      width: var(--pane-2-width);
      max-width: var(--pane-2-width);
    }
    &:nth-of-type(3) {
      width: var(--pane-3-width);
      max-width: var(--pane-3-width);
    }
    &:nth-of-type(4) {
      width: var(--pane-4-width);
      max-width: var(--pane-4-width);
    }
    &:nth-of-type(5) {
      width: var(--pane-5-width);
      max-width: var(--pane-5-width);
    }

    &:last-of-type {
      flex-grow: 1;
      width: unset;
      flex-basis: 0;
    }
  }
}
</style>
