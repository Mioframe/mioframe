<script setup lang="ts">
import MDRipple from './MDRipple.vue';
import { setupRipple } from './setupRipple';
import { syncRef, syncRefs, useElementHover } from '@vueuse/core';
import { useTemplateRef, defineModel } from 'vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';

const { tag = 'div' } = defineProps<{
  disabled?: boolean;
  // TODO: реализовать dragged когда понадобится
  dragged?: boolean;

  tag?: 'button' | 'a' | 'div';
}>();

defineSlots<{
  default: () => unknown;
}>();

const {
  onPressUp,
  onPressDown,
  pressed: userPressed,
  onAnimationend,
  rippleSet,
} = setupRipple();

const pressedModel = defineModel<boolean>('pressed');

syncRefs(userPressed, pressedModel);

const refEl = useTemplateRef<HTMLElement>('refEl');

const userHover = useElementHover(refEl);

const hoverModel = defineModel<boolean>('hover');

syncRefs(userHover, hoverModel);

const { focused: userFocused } = useFirstFocus(refEl, { useTarget: true });

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

const onMouseDown = ({ clientX, clientY, currentTarget }: MouseEvent) => {
  if (currentTarget instanceof Element) {
    onPressDown(currentTarget, clientX, clientY);
  }
};

const onMouseUp = () => {
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

// TODO: добавить слои и состояния по MD
</script>

<template>
  <component
    :is="tag"
    ref="refEl"
    :disabled
    class="md-state"
    :class="{
      'md-state_hover': userHover,
      'md-state_disabled': disabled,
      'md-state_focused': userFocused,
      'md-state_pressed': userPressed,
      'md-state_dragged': dragged,
    }"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
    @mouseup="onMouseUp"
    @mouseleave="onMouseleave"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
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

    <div class="md-state__content">
      <slot />
    </div>

    <div class="md-state__target" />
  </component>
</template>

<style lang="css" scoped>
.md-state {
  position: relative;

  &__ripple {
    position: absolute;
    z-index: 0;

    --md-ripple-color: var(--md-content-color, currentColor);

    --md-ripple-duration-long: var(--md-sys-motion-duration-extra-long4, 1s);
    --md-ripple-duration-short: var(--md-sys-motion-duration-short4, 0.2s);

    --md-ripple-duration: var(--md-ripple-duration-short);
  }

  &__content {
    position: relative;
    z-index: 1;
    background: none;
  }

  &__target {
    position: absolute;
    z-index: 1;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    border-radius: inherit;
    background: transparent;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &_pressed {
    .md-state__ripple {
      --md-ripple-duration: var(--md-ripple-duration-long);
    }
  }

  &:disabled,
  &_disabled {
    pointer-events: none;
  }
}
</style>
