<script
  setup
  lang="ts"
  generic="Is extends 'button' | 'a' | 'label' | 'div' | 'li' = 'div'"
>
import { syncRef, syncRefs, useEventListener, useVibrate } from '@vueuse/core';
import { useTemplateRef, computed, ref, watch } from 'vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { useRipple } from './useRipple';
import { usePressed } from './usePressed';
import { useLastHover } from '@shared/lib/useLastHover';
import MDLayer from './MDLayer.vue';

const {
  is = 'div',
  disableRipple,
  draggable,
  for: labelFor,
  autofocus,
} = defineProps<{
  is?: Is;
  type?: Is extends 'button' ? 'button' | 'submit' | 'reset' : false;
  disabled?: boolean;
  disableRipple?: boolean;
  draggable?: boolean;
  id?: string;
  for?: Is extends 'label' ? string : false;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  click: [MouseEvent];
  mouseup: [MouseEvent];
  mousedown: [MouseEvent];
  contextmenu: [MouseEvent];
  keydown: [KeyboardEvent];
}>();

defineSlots<{
  default: () => unknown;
}>();

const pressedModel = defineModel<boolean>('pressed');

const hoverModel = defineModel<boolean>('hover');

const focusedModel = defineModel<boolean>('focused', { default: false });

const enableRipple = computed(
  () => !disableRipple || ['button', 'a'].includes(is),
);

const refEl = useTemplateRef<HTMLElement>('refEl');

const { pressed: userPressed, durationPressedState } = usePressed(refEl);

syncRefs(userPressed, pressedModel);

const userHover = useLastHover(refEl);

syncRefs(userHover, hoverModel);

const { focused: userFocused } = useFirstFocus(refEl, {
  useTarget: true,
  focusVisible: true,
});

syncRef(userFocused, focusedModel);

useEventListener(refEl, 'mousedown', (e: MouseEvent) => {
  emit('mousedown', e);
});

useEventListener(refEl, 'mouseup', (e: MouseEvent) => {
  emit('mouseup', e);
});

const { vibrate } = useVibrate();

useEventListener(refEl, 'click', (e) => {
  e.stopPropagation();
  vibrate([10]);
  emit('click', e);
});

useEventListener(refEl, 'keydown', (e) => {
  emit('keydown', e);
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

useRipple(computed(() => (enableRipple.value ? refEl.value : undefined)));

watch(
  [() => autofocus, refEl],
  ([autofocus, el]) => {
    if (autofocus && el) {
      el.focus();
    }
  },
  {
    immediate: true,
  },
);
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
    :for="labelFor"
  >
    <MDLayer
      class="md-state__layer"
      :hover="userHover"
      :focused="userFocused"
      :pressed="durationPressedState"
      :drag="isDrag"
    />

    <div class="md-state__target" />

    <div class="md-state__content">
      <slot />
    </div>
  </component>
</template>

<style lang="css" scoped>
.md-state {
  --md-state-display: initial;
  --md-state-flex-direction: initial;
  --md-state-box-shadow: initial;
  --md-state-outline-color: initial;

  --md-state-align-items: initial;
  --md-state-justify-content: initial;
  --md-state-height: initial;
  --md-state-min-height: initial;
  --md-state-width: initial;
  --md-state-min-width: initial;
  --md-state-box-sizing: border-box;
  --md-state-border-radius: initial;
  --md-state-border: initial;
  --md-state-border-width: initial;
  --md-state-border-color: initial;
  --md-state-border-style: initial;
  --md-state-padding-top: initial;
  --md-state-padding-right: initial;
  --md-state-padding-bottom: initial;
  --md-state-padding-left: initial;

  --md-state-bounding-height: 100%;
  --md-state-bounding-width: 100%;
  --md-content-color: inherit;
  --md-container-color: inherit;
  --md-state-target-offset: var(--md-target-offset, 4px);
  --md-target-width: max(
    calc(var(--md-state-bounding-width) + var(--md-state-target-offset) * 2),
    var(--md-target-max-width, 48px)
  );
  --md-target-height: max(
    calc(var(--md-state-bounding-height) + var(--md-state-target-offset) * 2),
    var(--md-target-max-width, 48px)
  );

  display: var(--md-state-display, initial);
  width: var(--md-state-width);
  min-width: var(--md-state-min-width);
  box-shadow: var(--md-state-box-shadow);
  border-radius: var(--md-state-border-radius);
  outline-color: var(--md-state-outline-color);
  padding: 0;
  border: 0;

  user-select: none;

  transition-property:
    box-shadow, color, background-color, padding, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

  position: relative;
  -webkit-tap-highlight-color: transparent;

  &__layer {
    display: block;
    position: absolute;
    z-index: 1;
    inset: 0;
    width: var(--md-state-bounding-width);
    height: var(--md-state-bounding-height);
  }

  &__content {
    position: relative;
    z-index: 1;
    --md-container-color: transparent;
    flex-grow: 1;
    flex-shrink: 0;

    display: var(--md-state-display);
    align-items: var(--md-state-align-items);
    justify-content: var(--md-state-justify-content);
    flex-direction: var(--md-state-flex-direction);

    height: var(--md-state-height);
    min-height: var(--md-state-min-height);
    width: var(--md-state-width);
    min-width: var(--md-state-min-width);
    max-width: 100%;
    box-sizing: var(--md-state-box-sizing);

    border-radius: var(--md-state-border-radius);
    border: var(--md-state-border);
    border-width: var(--md-state-border-width);
    border-color: var(--md-state-border-color);
    border-style: var(--md-state-border-style);

    padding-top: var(--md-state-padding-top);
    padding-right: var(--md-state-padding-right);
    padding-bottom: var(--md-state-padding-bottom);
    padding-left: var(--md-state-padding-left);
  }

  &__target {
    position: absolute;
    z-index: 1;
    width: var(--md-target-width);
    height: var(--md-target-height);
    border-radius: inherit;
    background: transparent;
    top: calc(var(--md-state-bounding-height) / 2);
    left: calc(var(--md-state-bounding-width) / 2);
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
    will-change: border-radius;

    > .md-state__content {
      will-change: border-radius;
    }
  }

  &:focus-visible,
  &.md-state_focused {
    outline: none;
    z-index: 2;
  }

  &.md-state_drag,
  &.md-state_dragged-chosen,
  &.md-state_dragged,
  &.md-state_dragged-fallback {
    opacity: 1 !important;
    /* transition-duration: 0s; */
    box-shadow: var(--md-sys-elevation-level2);
    z-index: 2;
    border-radius: 6step !important;
  }

  &.md-state_dragged-ghost {
    opacity: 0 !important;
  }
}
</style>
