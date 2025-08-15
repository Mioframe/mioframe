<script
  setup
  lang="ts"
  generic="Is extends 'button' | 'a' | 'div' | 'li' = 'div'"
>
import {
  syncRef,
  syncRefs,
  tryOnScopeDispose,
  useEventListener,
} from '@vueuse/core';
import { useTemplateRef, computed, ref, watchEffect } from 'vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { useFocusIndicator } from './useFocusIndicator';
import { useRipple } from './useRipple';
import { usePressed } from './usePressed';
import { useHover } from '@shared/lib/useHover';

const {
  is = 'div',
  disableRipple = false,
  draggable,
} = defineProps<{
  is?: Is;
  type?: Is extends 'button' ? 'button' | 'submit' | 'reset' : false;
  disabled?: boolean;
  disableRipple?: boolean;
  draggable?: boolean;
  id?: string;
}>();

const emit = defineEmits<{
  click: [MouseEvent];
  mouseup: [MouseEvent];
  mousedown: [MouseEvent];
  contextmenu: [MouseEvent];
}>();

defineSlots<{
  default: () => unknown;
}>();

const enableRipple = computed(
  () => !disableRipple || ['button', 'a'].includes(is),
);

const pressedModel = defineModel<boolean>('pressed');

const refEl = useTemplateRef<HTMLElement>('refEl');

const { pressed: userPressed, durationPressedState } = usePressed(refEl);

syncRefs(userPressed, pressedModel);

const userHover = useHover(refEl);

const hoverModel = defineModel<boolean>('hover');

syncRefs(userHover, hoverModel);

const { focused: userFocused } = useFirstFocus(refEl, {
  useTarget: true,
  focusVisible: true,
});

const { showFocus, removeFocus } = useFocusIndicator();

watchEffect(() => {
  if (userFocused.value) {
    showFocus(refEl.value);
  } else {
    removeFocus(refEl.value);
  }
});

const focusedModel = defineModel<boolean>('focused', { default: false });

syncRef(userFocused, focusedModel);

useEventListener(refEl, 'mousedown', (e: MouseEvent) => {
  emit('mousedown', e);
});

useEventListener(refEl, 'mouseup', (e: MouseEvent) => {
  emit('mouseup', e);
});

useEventListener(refEl, 'click', (e) => {
  e.stopPropagation();
  emit('click', e);
});

useEventListener(refEl, 'contextmenu', (e) => {
  e.preventDefault();
  emit('contextmenu', e);
});

const isDrag = ref(false);

useEventListener(refEl, 'dragstart', () => {
  isDrag.value = true;
});

useEventListener(refEl, ['dragend', 'touchend'], () => {
  isDrag.value = false;
});
useEventListener(refEl, 'drop', () => {
  isDrag.value = false;
});

tryOnScopeDispose(() => {
  removeFocus(refEl.value);
});

useRipple(computed(() => (enableRipple.value ? refEl.value : undefined)));
</script>

<template>
  <component
    :is="is"
    :id="id"
    ref="refEl"
    :type="type"
    :disabled="disabled ? true : undefined"
    class="md md-state"
    :class="{
      'md-state_hover': userHover,
      'md-state_disabled': disabled,
      'md-state_focused': userFocused,
      'md-state_pressed': durationPressedState,
      'md-state_drag': isDrag,
    }"
    :draggable="draggable ? 'true' : undefined"
  >
    <div class="md-state__layer" />

    <div class="md-state__target" />

    <slot />
  </component>
</template>

<style lang="css" scoped>
.md-state {
  --md-content-color: inherit;
  --md-container-color: inherit;
  --md-state-target-offset: var(--md-target-offset, 4px);
  --md-target-width: max(calc(100% + var(--md-state-target-offset) * 2), 48px);
  --md-target-height: max(calc(100% + var(--md-state-target-offset) * 2), 48px);

  user-select: none;

  transition-property:
    box-shadow, color, background-color, padding, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

  position: relative;
  -webkit-tap-highlight-color: transparent;

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

  &.md-state_hover {
    > .md-state__layer {
      background-color: rgb(from var(--md-content-color) r g b / 8%);
    }
  }

  &.md-state_pressed {
    > .md-state__layer {
      background-color: rgb(from var(--md-content-color) r g b / 10%);
    }
  }

  &:focus-visible,
  &.md-state_focused {
    outline: none;
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
  }

  &.md-state_dragged-ghost {
    opacity: 0 !important;
  }
}
</style>
