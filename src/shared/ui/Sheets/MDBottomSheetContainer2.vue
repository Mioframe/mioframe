<script setup lang="ts">
import type { StyleValue } from 'vue';
import { computed, useTemplateRef, watch } from 'vue';
import { MDState } from '../State';
import { useScroll } from '@shared/lib/scrollTo';
import { useAriaHidden } from '../AriaHidden';
import { usePaneContainer } from '../Layout/useMDContainer';
import { useElementBounding, useElementSize } from '@vueuse/core';

defineSlots<{
  default(): unknown;
}>();

const openModel = defineModel<boolean>('open', { required: true });

const scrollPositionModel = defineModel<number>('scrollPosition');

const containerEl = useTemplateRef<HTMLElement>('containerEl');

const onClickDragHandle = () => {
  openModel.value = !openModel.value;
};

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
  ([open, bodyHeight, bodyEl]) => {
    if (bodyHeight && bodyEl) {
      if (open) {
        const top = Math.min(bodyHeight, bodyEl.offsetTop);
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

const ariaHidden = useAriaHidden();

const paneContainer = usePaneContainer();

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
        <MDState
          is="button"
          class="md-bottom-sheet__drag-handle"
          @click="onClickDragHandle"
        >
          <span class="md-bottom-sheet__drag-pill" />
        </MDState>
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
    bottom: 0;
    padding-top: 100cqh;
    overflow-y: auto;
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
    --md-state-width: 100%;
    --md-state-display: block;
    padding: 2step;
    border-radius: 2step;
  }

  &__drag-pill {
    display: block;
    background-color: rgb(
      from var(--md-sys-color-on-surface-variant) r g b / 0.4
    );
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
        transition-timing-function: var(
          var(--md-sys-motion-easing-emphasized-accelerate)
        );
        transition-duration: var(--md-sys-motion-duration-short4);
      }
    }

    &-enter-active {
      &::before {
        transition-timing-function: var(
          var(--md-sys-motion-easing-emphasized-decelerate)
        );
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
