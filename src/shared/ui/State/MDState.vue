<script
  setup
  lang="ts"
  generic="Is extends 'button' | 'a' | 'div' | 'li' = 'div'"
>
import MDRipple from './MDRipple.vue';
import { setupRipple } from './setupRipple';
import {
  syncRef,
  syncRefs,
  tryOnScopeDispose,
  useElementHover,
  useVibrate,
} from '@vueuse/core';
import { useTemplateRef, defineModel, computed } from 'vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { debounce } from 'es-toolkit';

const { is = 'div', disableRipple = false } = defineProps<{
  is?: Is;
  type?: Is extends 'button' ? 'button' | 'submit' | 'reset' : false;
  disabled?: boolean;
  disableRipple?: boolean;
  draggable?: boolean;
}>();

const emit = defineEmits<{
  click: [MouseEvent];
  mouseup: [MouseEvent];
  mousedown: [MouseEvent];
}>();

defineSlots<{
  default: () => unknown;
}>();

const enableRipple = computed(
  () => !disableRipple || ['button', 'a'].includes(is),
);

const {
  onPressUp,
  onPressDown,
  pressed: userPressed,
  onAnimationend,
  rippleSet,
} = setupRipple(enableRipple);

const pressedModel = defineModel<boolean>('pressed');

syncRefs(userPressed, pressedModel);

const refEl = useTemplateRef<HTMLElement>('refEl');

const userHover = useElementHover(refEl);

const hoverModel = defineModel<boolean>('hover');

syncRefs(userHover, hoverModel);

const { focused: userFocused } = useFirstFocus(refEl, {
  useTarget: true,
  focusVisible: true,
});

const focusedModel = defineModel<boolean>('focused', { default: false });

syncRef(userFocused, focusedModel);

const onMouseleave = () => {
  onPressUp();
};

const onTouchEnd = () => {
  onPressUp();
};

const onTouchCancel = () => {
  onPressUp();
};

const onMouseDown = (e: MouseEvent) => {
  emit('mousedown', e);

  const { clientX, clientY, currentTarget } = e;

  if (currentTarget instanceof Element) {
    e.stopPropagation();
    onPressDown(currentTarget, clientX, clientY);
  }
};

const onMouseUp = (e: MouseEvent) => {
  emit('mouseup', e);
  e.stopPropagation();
  onPressUp();
};

const onTouchStart = ({
  touches: [{ clientX, clientY }],
  currentTarget: element,
}: TouchEvent) => {
  if (element instanceof Element) {
    onPressDown(element, clientX, clientY);
  }
};

const onKeyDown = debounce(
  ({ currentTarget, key }: KeyboardEvent) => {
    if (key === ' ' || key === 'Enter') {
      if (currentTarget instanceof Element) {
        onPressDown(currentTarget, 0, 0);
      }
    }
  },
  500,
  {
    edges: ['leading'],
  },
);

const onKeyUp = () => {
  onKeyDown.cancel();
  onPressUp();
};

const { vibrate } = useVibrate();

const onClickState = (e: MouseEvent) => {
  emit('click', e);
  vibrate([10]);
};

tryOnScopeDispose(() => {
  onKeyUp();
});

// FIXME: в firefox после удержания остаётся нежелательный эффект состояния
// FIXME: в chrome при нажатии кнопки подсвечиваются синим
</script>

<template>
  <component
    :is="is"
    ref="refEl"
    :type="type"
    :disabled="disabled ? true : undefined"
    class="md md-state"
    :class="{
      'md-state_hover': userHover,
      'md-state_disabled': disabled,
      'md-state_focused': userFocused,
      'md-state_pressed': userPressed,
    }"
    :draggable="draggable ? 'true' : undefined"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
    @mouseup="onMouseUp"
    @mouseleave="onMouseleave"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @click="onClickState"
  >
    <div class="md-state__layer" />

    <MDRipple
      v-for="[id, options] in rippleSet"
      :key="id"
      :state="options.state"
      class="md-state__ripple"
      :x="options.offsetX"
      :y="options.offsetY"
      :diameter="options.diameter"
      @animationend="onAnimationend(id, $event)"
    />

    <div class="md-state__target" />

    <slot />
  </component>
</template>

<style lang="css" scoped>
.md-state {
  --md-content-color: inherit;
  --md-container-color: inherit;
  --md-target-offset: 4px;
  --md-target-width: calc(100% + var(--md-target-offset) * 2);
  --md-target-height: calc(100% + var(--md-target-offset) * 2);
  --md-focus-indicator-thickness: var(
    --md-sys-state-focus-indicator-thickness,
    3px
  );
  --md-focus-indicator-offset: var(
    --md-sys-state-focus-indicator-outer-offset,
    2px
  );

  transition-property:
    box-shadow, color, background-color, padding, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

  position: relative;

  &__layer {
    display: block;
    position: absolute;
    z-index: 0;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border-radius: inherit;
    background: none;
    background-color: rgb(from var(--md-content-color) r g b / 0);
    transition-property: background, background-color;
    transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  }

  &__ripple {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 0;
    border-radius: inherit;

    --md-ripple-color: var(--md-content-color, currentColor);

    --md-ripple-duration-long: var(--md-sys-motion-duration-extra-long4, 1s);
    --md-ripple-duration-short: var(--md-sys-motion-duration-short4, 0.2s);

    --md-ripple-duration: var(--md-ripple-duration-short);
  }

  :deep(> *) {
    z-index: 0;
    --md-container-color: transparent;
  }

  &__target {
    position: absolute;
    z-index: 0;
    width: var(--md-target-width);
    height: var(--md-target-height);
    border-radius: inherit;
    background: transparent;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &:disabled,
  &.md-state_disabled {
    pointer-events: none;
    --md-container-color: rgb(
      from var(--md-sys-color-on-surface) r g b / 0.1
    ) !important;
    --md-content-color: rgb(
      from var(--md-sys-color-on-surface) r g b / 0.38
    ) !important;
  }

  &:hover,
  &.md-state_hover {
    > .md-state__layer {
      background-color: rgb(from var(--md-content-color) r g b / 8%);
    }
  }

  &.md-state_pressed {
    > .md-state__layer {
      background-color: rgb(from var(--md-content-color) r g b / 10%);
    }
    > .md-state__ripple {
      --md-ripple-duration: var(--md-ripple-duration-long);
    }
  }

  &:focus-visible,
  &.md-state_focused {
    outline: var(--md-focus-indicator-thickness) solid
      var(
        --md-sys-color-secondary,
        var(--md-container-color, rgb(88, 174, 255))
      );
    outline-offset: var(--md-focus-indicator-offset);
    z-index: 1;

    > .md-state__layer {
      background-color: rgb(from var(--md-content-color) r g b / 10%);
    }
  }

  &.md-state_drag,
  &.md-state_dragged-chosen,
  &.md-state_dragged,
  &.md-state_dragged-fallback {
    opacity: 1 !important;
    /* transition-duration: 0s; */
    box-shadow: var(--md-sys-elevation-level2);
    z-index: 1;
    border-radius: 6step !important;

    > .md-state__layer {
      /* transition-duration: 0s; */
      background-color: rgb(from var(--md-content-color) r g b / 16%);
    }
    > .md-state__ripple {
      opacity: 0;
      /* transition-duration: 0s; */

      /* --md-ripple-duration: 0s; */
    }
  }

  &.md-state_dragged-ghost {
    opacity: 0 !important;
  }
}
</style>
