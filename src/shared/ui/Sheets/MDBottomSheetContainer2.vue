<script setup lang="ts">
import type { StyleValue } from 'vue';
import { computed, nextTick, useTemplateRef, watch } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { useScroll } from '@shared/lib/scrollTo';
import { useModalAriaHidden } from '../AriaHidden';
import { usePaneScrollContainer } from '../Layout';
import { tryOnBeforeUnmount, useElementBounding, useElementSize } from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useOnEscapeKeyStackedWhen } from '@shared/lib/useOnEscapeKeyStacked';
import { useOnBackNavigationStackedWhen } from '@shared/lib/onBackNavigation';

const openModel = defineModel<boolean>('open', { required: true });

const scrollPositionModel = defineModel<number | undefined>('scrollPosition');

const props = withDefaults(
  defineProps<{
    dragHandleExpandLabel?: string | undefined;
    dragHandleCloseLabel?: string | undefined;
  }>(),
  {
    dragHandleCloseLabel: 'Close sheet',
    dragHandleExpandLabel: 'Expand sheet',
  },
);

defineSlots<{
  default(): unknown;
}>();

const containerEl = useTemplateRef<HTMLElement>('containerEl');

const onClickDragHandle = () => {
  openModel.value = !openModel.value;
};

const dragHandleEl = useTemplateRef<HTMLButtonElement>('dragHandleEl');
const {
  hover: dragHandleHover,
  focused: dragHandleFocused,
  durationPressedState: dragHandlePressed,
} = useStateLayer(dragHandleEl);

useRipple(dragHandleEl);

const bodyEl = useTemplateRef<HTMLElement>('bodyEl');

const { height: bodyHeight } = useElementSize(
  bodyEl,
  { height: 0, width: 0 },
  {
    box: 'border-box',
  },
);

const { position, scrollTo } = useScroll(containerEl, {
  throttleMs: 1e3 / 60,
});

watch(position, ({ scrollTop }) => {
  scrollPositionModel.value = scrollTop;
});

watch(
  [openModel, bodyHeight, bodyEl],
  ([open, currentBodyHeight, currentBodyEl]) => {
    if (currentBodyHeight && currentBodyEl) {
      if (open) {
        const top = Math.min(currentBodyHeight, currentBodyEl.offsetTop);
        void scrollTo({
          top,
        });
      } else {
        void scrollTo({
          top: 0,
        });
      }
    }
  },
  { immediate: true },
);

const onClickScrim = () => {
  void scrollTo({
    top: 0,
  });
};

const ariaHidden = useModalAriaHidden();

// preventScroll stops the trap's internal focus() calls (initial activation and its
// mutation-driven fallback redirect when the previously focused element leaves the DOM,
// e.g. during a reorder drag) from triggering the browser's native scroll-into-view, which
// would otherwise move this component's own scrollable scrim — the sheet's positioning
// mechanism — out from under the user.
const { activate: lockFocus, deactivate: unlockFocus } = useFocusTrap(containerEl, {
  allowOutsideClick: true,
  preventScroll: true,
});

watch(
  [openModel, containerEl],
  async ([showModel]) => {
    if (showModel) {
      await nextTick();
      if (containerEl.value) {
        lockFocus();
      }
    } else {
      unlockFocus();
    }
  },
  { immediate: true, flush: 'post' },
);

tryOnBeforeUnmount(unlockFocus);

const paneContainer = usePaneScrollContainer();

const { left: paneLeft, width: paneWidth } = useElementBounding(paneContainer, {
  updateTiming: 'next-frame',
  windowScroll: false,
  immediate: false,
});

const scrimStyle = computed(
  (): StyleValue => ({
    paddingLeft: `${paneLeft.value}px`,
    paddingRight: `calc(100% - ${paneLeft.value + paneWidth.value}px)`,
  }),
);

const bodyStyle = computed(
  (): StyleValue => ({
    width: `${paneWidth.value}px`,
  }),
);

useOnEscapeKeyStackedWhen(openModel, () => {
  openModel.value = false;
  return false;
});

useOnBackNavigationStackedWhen(openModel, () => {
  openModel.value = false;
  return false;
});
</script>

<template>
  <div
    ref="containerEl"
    class="md-bottom-sheet md-bottom-sheet__scrim"
    role="dialog"
    :aria-hidden="ariaHidden"
    :style="scrimStyle"
    @click.self="onClickScrim"
  >
    <div ref="bodyEl" class="md md-bottom-sheet__body" :style="bodyStyle">
      <div class="md-bottom-sheet__header">
        <button
          ref="dragHandleEl"
          type="button"
          class="md-bottom-sheet__drag-handle"
          :aria-label="openModel ? props.dragHandleCloseLabel : props.dragHandleExpandLabel"
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
          <span class="md-bottom-sheet__drag-pill" />
        </button>
      </div>

      <slot />
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-bottom-sheet {
  --border-radius: var(--md-sys-shape-corner-extra-large-top);
  --md-bottom-sheet-width: min(var(--md-pane-width, 100%), 100%, 640px);

  &_fullscreen {
    --border-radius: 0px;
  }

  &__scrim {
    display: block;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    height: 100svh;
    padding-top: 100cqh;
    overflow-y: auto;
    overflow-anchor: none;
    scrollbar-width: none;
    overscroll-behavior-y: none;
    box-sizing: border-box;
    transition: none;
    pointer-events: none;

    &::before {
      content: '';
      display: block;
      position: fixed;
      background-color: rgb(from var(--md-sys-color-scrim) r g b / 10%);
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      pointer-events: auto;
      z-index: -1;
    }
  }

  &__body {
    pointer-events: auto;
    box-shadow: var(--md-sys-elevation-level1);
    border-radius: var(--border-radius);
    max-width: 640px;
    box-sizing: border-box;
    margin-left: auto;
    margin-right: auto;

    display: flex;
    flex-direction: column;
  }

  &__header {
    padding: 0 7step;
  }

  &__drag-handle {
    position: relative;
    display: block;
    width: 100%;
    padding: 2step;
    border-radius: 2step;
    border: 0;
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

  &.v {
    &-enter-active,
    &-leave-active {
      &::before {
        transition-property: background-color;
      }
    }

    &-leave-active {
      &::before {
        transition-timing-function: var(var(--md-sys-motion-easing-emphasized-accelerate));
        transition-duration: var(--md-sys-motion-duration-short4);
      }
    }

    &-enter-active {
      &::before {
        transition-timing-function: var(var(--md-sys-motion-easing-emphasized-decelerate));
        transition-duration: var(--md-sys-motion-duration-long2);
      }
    }

    &-leave-to,
    &-enter-from {
      &::before {
        background-color: transparent;
      }
    }
  }
}
</style>
