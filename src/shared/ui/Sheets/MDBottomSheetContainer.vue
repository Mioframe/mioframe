<script setup lang="ts">
import { tryOnBeforeUnmount, useCssVar, useEventListener, useWindowSize } from '@vueuse/core';
import { isBoolean, throttle } from 'es-toolkit';
import { toNumber } from 'es-toolkit/compat';
import { computed, ref, toRefs, useTemplateRef, watch, watchEffect } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const modelFullscreen = defineModel<boolean>('fullscreen', {
  default: undefined,
});

const props = withDefaults(
  defineProps<{
    width?: number | undefined;
    collapsed?: boolean | undefined;
    type?: 'standard' | 'modal' | undefined;
  }>(),
  { collapsed: undefined, type: 'standard' },
);

const emit = defineEmits<{
  'update:collapsed': [boolean];
  clickContainer: [];
}>();

defineSlots<{
  default(): unknown;
}>();

const { width, collapsed: collapsedProp, type: sheetType } = toRefs(props);

const containerEl = useTemplateRef('containerEl');

const containerScrollY = ref<number>(0);

const collapsedState = computed(() => containerScrollY.value === 0);

useEventListener(
  containerEl,
  'scroll',
  throttle(() => {
    containerScrollY.value = containerEl.value?.scrollTop ?? 0;
  }, 1e3 / 10),
);

const sheetWidthCssVar = useCssVar('--md-bottom-sheet-width', containerEl);

watchEffect(() => {
  sheetWidthCssVar.value = width.value ? `${width.value}px` : undefined;
});

const dragHandleHeightCssVar = useCssVar('--md-bottom-sheet-drag-height', containerEl);

const dragHandleHeight = computed(() => toNumber(dragHandleHeightCssVar.value));

const headerEl = useTemplateRef('headerEl');

const onClickDragHandle = () => {
  if (containerEl.value instanceof Element) {
    if (collapsedState.value) {
      const firstSection = headerEl.value?.nextElementSibling;

      if (firstSection instanceof Element) {
        firstSection.scrollIntoView({
          block: 'nearest',
        });
      }
    } else {
      containerEl.value.scrollTo({ top: 0 });
    }
  }
};

const dragHandleEl = useTemplateRef<HTMLButtonElement>('dragHandleEl');
const {
  hover: dragHandleHover,
  focused: dragHandleFocused,
  durationPressedState: dragHandlePressed,
} = useStateLayer(dragHandleEl);

useRipple(dragHandleEl);

const { height: windowHeight } = useWindowSize();

const fullscreen = computed(
  () => containerScrollY.value >= windowHeight.value - dragHandleHeight.value,
);

watch(fullscreen, (isFullscreen) => {
  modelFullscreen.value = isFullscreen;
});

watchEffect(() => {
  if (containerEl.value instanceof Element && isBoolean(collapsedProp.value)) {
    if (collapsedProp.value) {
      containerEl.value.scrollTo({
        top: 0,
      });
    } else {
      const firstSection = headerEl.value?.nextElementSibling;

      if (firstSection instanceof Element) {
        firstSection.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }
});

watch(collapsedState, (collapsed) => {
  if (collapsedProp.value !== collapsed) {
    emit('update:collapsed', collapsed);
  }
});

const onClickContainer = () => {
  emit('clickContainer');
};

const role = computed(() => (props.type === 'modal' ? 'dialog' : 'region'));

tryOnBeforeUnmount(() => {
  if (containerEl.value instanceof Element) {
    containerEl.value.scrollTo({
      top: 0,
    });
  }
});
</script>

<template>
  <div
    ref="containerEl"
    class="md md-bottom-sheet-container"
    :class="[
      `md-bottom-sheet-container_type-${sheetType}`,
      {
        'mb-bottom-sheet-container_collapsed': collapsedState,
        'mb-bottom-sheet-container_fullscreen': fullscreen,
      },
    ]"
    :role="role"
    @click.self="onClickContainer"
  >
    <div ref="headerEl" class="md-bottom-sheet-container__header md">
      <button
        ref="dragHandleEl"
        type="button"
        class="md-bottom-sheet-container__drag-handle"
        :aria-label="collapsedState ? undefined : 'close sheet'"
        :class="{
          'md-state_hover': dragHandleHover,
          'md-state_focused': dragHandleFocused,
          'md-state_pressed': dragHandlePressed,
        }"
        @click="onClickDragHandle"
      >
        <MDStateLayer
          :hover="dragHandleHover"
          :focused="dragHandleFocused"
          :pressed="dragHandlePressed"
        />
        <span class="md-bottom-sheet-container__drag-pill" />
      </button>
    </div>

    <slot />
  </div>
</template>

<style lang="css" scoped>
.md-bottom-sheet-container {
  --md-bottom-sheet-width: unset;
  --md-bottom-sheet-min-height: 0px;
  --md-bottom-sheet-border-radius: var(--md-sys-shape-corner-extra-large-top);
  --md-bottom-sheet-shadow: var(--md-sys-elevation-level1);
  --md-bottom-sheet-container-color: var(--md-sys-color-surface-container-low);
  --md-bottom-sheet-content-color: var(--md-sys-color-surface-on-container-low);
  --md-bottom-sheet-scroll-y: initial;
  --md-bottom-sheet-drag-height: 28px;

  --offset-for-shadow: 50vw;

  height: 100dvh;
  width: calc((var(--md-bottom-sheet-width) + var(--offset-for-shadow) * 2));
  overflow-y: auto;
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
  padding: 0 var(--offset-for-shadow);
  margin: 0 calc(var(--offset-for-shadow) * -1);
  box-sizing: border-box;
  scrollbar-width: none;
  pointer-events: none;
  background-color: transparent;
  overscroll-behavior-y: none;
  display: flex;
  flex-direction: column;
  align-items: center;

  &::before {
    content: '';
    display: block;
    height: calc(100dvh - var(--md-bottom-sheet-min-height));
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  &::after {
    content: '';
    display: block;
    position: absolute;
    height: var(--md-bottom-sheet-drag-height);
    box-shadow: var(--md-bottom-sheet-shadow);
    border-radius: var(--md-bottom-sheet-border-radius);
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-property: border-radius;

    flex-shrink: 0;
    top: calc(100dvh - var(--md-bottom-sheet-min-height));
    max-width: 640px;
    width: calc(100% - var(--offset-for-shadow) * 2);
    z-index: -1;
  }

  &__drag-handle {
    position: relative;
    display: flex;
    width: 100%;
    height: var(--md-bottom-sheet-drag-height);
    border: 0;
    border-radius: var(--md-bottom-sheet-border-radius);
    background: transparent;
  }

  &__drag-pill {
    display: block;
    background-color: rgb(from var(--md-sys-color-on-surface-variant) r g b / 0.4);
    width: 32px;
    height: 4px;
    border-radius: 2px;
    margin: auto;
  }

  &__header {
    border-radius: var(--md-bottom-sheet-border-radius);
    position: sticky;
    top: 0;
    z-index: 2;
    --md-container-color: var(--md-bottom-sheet-container-color);
    --md-content-color: var(--md-bottom-sheet-content-color);
    max-width: 640px;
    width: 100%;
    pointer-events: all;
  }

  &.mb-bottom-sheet-container_fullscreen {
    --md-bottom-sheet-border-radius: 0;
  }

  &.md-bottom-sheet-container_type-modal {
    background-color: rgb(from var(--md-sys-color-scrim) r g b / 10%);
    box-shadow: 0 -100dvh 0 rgb(from var(--md-sys-color-scrim) r g b / 10%);
    pointer-events: all;
  }

  &.v {
    &-enter-active,
    &-leave-active {
      transition-property: transform, background-color, box-shadow;
    }

    &-leave-active {
      transition-timing-function: var(var(--md-sys-motion-easing-emphasized-accelerate));
      transition-duration: var(--md-sys-motion-duration-short4);
    }

    &-enter-active {
      transition-timing-function: var(var(--md-sys-motion-easing-emphasized-decelerate));
      transition-duration: var(--md-sys-motion-duration-long2);

      scroll-behavior: auto;
    }

    &-leave-to,
    &-enter-from {
      &.md-bottom-sheet-container_type-modal {
        background-color: transparent;
        box-shadow: 0 -100dvh 0 transparent;
      }

      transform: translateY(calc(var(--md-bottom-sheet-scroll-y, 100%)));
    }
  }
}
</style>
