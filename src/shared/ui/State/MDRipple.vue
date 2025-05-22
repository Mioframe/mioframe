<script setup lang="ts">
import { useCssVar } from '@vueuse/core';
import { RippleAnimation } from './types';
import { useTemplateRef, watchEffect } from 'vue';

const { state, x, y, diameter } = defineProps<{
  state?: 'enter' | 'default' | 'leave';
  x?: number;
  y?: number;
  diameter?: number;
}>();

const emit = defineEmits<{
  animationend: [animation: RippleAnimation];
}>();

const onAnimationend = (e: AnimationEvent) => {
  const { animationName } = e;
  if (animationName.includes('md-ripple-enter')) {
    emit('animationend', RippleAnimation.enter);
  } else if (animationName.includes('md-ripple-leave')) {
    emit('animationend', RippleAnimation.leave);
  }
};

const el = useTemplateRef('el');

const cssX = useCssVar('--md-ripple-x', el);
const cssY = useCssVar('--md-ripple-y', el);
const cssDiameter = useCssVar('--md-ripple-diameter', el);

watchEffect(() => {
  if (x !== undefined) {
    cssX.value = `${x}px`;
  }
  if (y !== undefined) {
    cssY.value = `${y}px`;
  }
  if (diameter !== undefined) {
    cssDiameter.value = `${diameter}px`;
  }
});
</script>

<template>
  <div
    ref="el"
    class="md-ripple"
    :class="{
      'md-ripple_enter': state === 'enter',
      'md-ripple_leave': state === 'leave',
    }"
    @animationend="onAnimationend"
  />
</template>

<style lang="css" scoped>
.md-ripple {
  --md-ripple-color: var(--md-content-color, currentColor);
  --md-ripple-duration-long: var(--md-sys-motion-duration-extra-long4, 1s);
  --md-ripple-duration-short: var(--md-sys-motion-duration-short4, 0.2s);
  --md-ripple-duration: var(--md-sys-motion-duration-short4, 0.2s);

  display: block;
  position: relative;
  pointer-events: none;
  width: 100%;
  height: 100%;
  background: transparent;
  overflow: hidden;
  border-radius: inherit;

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: var(--md-ripple-y, 50%);
    left: var(--md-ripple-x, 50%);
    width: calc(var(--md-ripple-diameter, 140%) + 15%);
    height: calc(var(--md-ripple-diameter, 140%) + 15%);
    border-radius: 50%;
    padding: 10%;
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    animation-duration: var(--md-ripple-duration);
    transition-duration: var(--md-ripple-duration);
    transition-property: opacity, transform;

    background: radial-gradient(
      rgb(
          from var(--md-ripple-color, var(--md-content-color, currentColor)) r g
            b / var(--md-sys-state-pressed-state-layer-opacity, 10%)
        )
        65%,
      transparent 71%
    );
  }

  &_enter {
    &::before {
      animation-fill-mode: forwards;
      animation-name: md-ripple-enter;
    }
  }

  &_leave {
    &::before {
      animation-fill-mode: forwards;
      animation-name: md-ripple-leave;
    }
  }
}

@keyframes md-ripple-enter {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0);
  }

  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes md-ripple-leave {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
