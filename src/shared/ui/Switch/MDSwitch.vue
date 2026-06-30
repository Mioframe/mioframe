<script setup lang="ts">
import { computed, toRefs, useTemplateRef, watch } from 'vue';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { sessionUniqueId } from '@shared/lib/uniqueId';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean | undefined;
    disabled?: boolean | undefined;
    id?: string | undefined;
    ariaLabel?: string | undefined;
    autofocus?: boolean | undefined;
    tabIndex?: number | undefined;
    presentation?: boolean | undefined;
  }>(),
  {
    modelValue: false,
    id: () => sessionUniqueId('switch'),
    tabIndex: 0,
  },
);

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  click: [];
}>();

const { disabled, modelValue, presentation } = toRefs(props);

const stateValue = computed({
  get: () => !!modelValue.value,
  set: (v: boolean) => {
    emit('update:modelValue', v);
  },
});

const toggle = () => {
  if (presentation.value || disabled.value) {
    return;
  }

  emit('click');
  stateValue.value = !stateValue.value;
};

const onClickContainer = (e: MouseEvent) => {
  if (presentation.value || disabled.value) {
    return;
  }

  e.preventDefault();
  toggle();
};

const onKeydownContainer = (event: KeyboardEvent) => {
  if (presentation.value || disabled.value) {
    return;
  }

  const { key } = event;
  if (!['Enter', ' '].includes(key)) {
    return;
  }

  event.preventDefault();
  toggle();
};

const switchEl = useTemplateRef<HTMLElement>('switchEl');
const { hover, focused, durationPressedState } = useStateLayer(switchEl);
const interactiveTabIndex = computed(() => (disabled.value ? -1 : props.tabIndex));
const showVisualState = computed(() => !disabled.value);

useRipple(computed(() => (!presentation.value && !disabled.value ? switchEl.value : undefined)));

watch(
  [switchEl, () => props.autofocus, disabled],
  ([element, autofocus, isDisabled]) => {
    if (autofocus && element && !isDisabled) {
      element.focus();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="presentation"
    class="md-switch md-switch_presentation"
    :class="{ 'md-switch_selected': stateValue, 'md-switch_disabled': disabled }"
    aria-hidden="true"
  >
    <div class="md-switch__track">
      <div class="md-switch__handle" />
    </div>
  </div>

  <label
    v-else
    ref="switchEl"
    :for="id"
    class="md-switch"
    :class="{
      'md-switch_selected': stateValue,
      'md-switch_disabled': disabled,
      'md-state_hover': showVisualState && hover,
      'md-state_focused': showVisualState && focused,
      'md-state_pressed': showVisualState && durationPressedState,
      'md-state_disabled': disabled,
    }"
    role="switch"
    :tabindex="interactiveTabIndex"
    :aria-label="ariaLabel"
    :aria-checked="stateValue"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onClickContainer"
    @keydown="onKeydownContainer"
  >
    <span class="md-switch__target" aria-hidden="true" />

    <MDStateLayer
      class="md-switch__state-layer"
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :disabled="disabled"
    />

    <input
      :id="id"
      v-model="stateValue"
      type="checkbox"
      :disabled="disabled"
      aria-hidden="true"
      class="md-switch__input"
      tabindex="-1"
    />

    <div class="md-switch__track">
      <div class="md-switch__handle" />
    </div>
  </label>
</template>

<style lang="css" scoped>
.md-switch {
  --md-comp-switch-track-width: 52dp;
  --md-comp-switch-track-height: 32dp;
  --md-comp-switch-track-shape: var(--md-sys-shape-corner-full);
  --md-comp-switch-track-outline-width: 2dp;
  --md-comp-switch-unselected-track-color: var(--md-sys-color-surface-container-highest);
  --md-comp-switch-unselected-track-outline-color: var(--md-sys-color-outline);
  --md-comp-switch-unselected-hover-track-color: var(--md-sys-color-surface-container-highest);
  --md-comp-switch-unselected-hover-track-outline-color: var(--md-sys-color-outline);
  --md-comp-switch-unselected-focus-track-color: var(--md-sys-color-surface-container-highest);
  --md-comp-switch-unselected-focus-track-outline-color: var(--md-sys-color-outline);
  --md-comp-switch-unselected-pressed-track-color: var(--md-sys-color-surface-container-highest);
  --md-comp-switch-unselected-pressed-track-outline-color: var(--md-sys-color-outline);
  --md-comp-switch-selected-track-color: var(--md-sys-color-primary);
  --md-comp-switch-selected-hover-track-color: var(--md-sys-color-primary);
  --md-comp-switch-selected-focus-track-color: var(--md-sys-color-primary);
  --md-comp-switch-selected-pressed-track-color: var(--md-sys-color-primary);
  --md-comp-switch-disabled-unselected-track-color: var(--md-sys-color-surface-container-highest);
  --md-comp-switch-disabled-unselected-track-outline-color: var(--md-sys-color-on-surface);
  --md-comp-switch-disabled-selected-track-color: var(--md-sys-color-on-surface);
  --md-comp-switch-disabled-track-opacity: 0.12;
  --md-comp-switch-handle-shape: var(--md-sys-shape-corner-full);
  --md-comp-switch-handle-width: 20dp;
  --md-comp-switch-handle-height: 20dp;
  --md-comp-switch-unselected-handle-width: 16dp;
  --md-comp-switch-unselected-handle-height: 16dp;
  --md-comp-switch-selected-handle-width: 24dp;
  --md-comp-switch-selected-handle-height: 24dp;
  --md-comp-switch-pressed-handle-width: 28dp;
  --md-comp-switch-pressed-handle-height: 28dp;
  --md-comp-switch-unselected-handle-color: var(--md-sys-color-outline);
  --md-comp-switch-unselected-hover-handle-color: var(--md-sys-color-on-surface-variant);
  --md-comp-switch-unselected-focus-handle-color: var(--md-sys-color-on-surface-variant);
  --md-comp-switch-unselected-pressed-handle-color: var(--md-sys-color-on-surface-variant);
  --md-comp-switch-selected-handle-color: var(--md-sys-color-on-primary);
  --md-comp-switch-selected-hover-handle-color: var(--md-sys-color-primary-container);
  --md-comp-switch-selected-focus-handle-color: var(--md-sys-color-primary-container);
  --md-comp-switch-selected-pressed-handle-color: var(--md-sys-color-primary-container);
  --md-comp-switch-disabled-unselected-handle-color: var(--md-sys-color-on-surface);
  --md-comp-switch-disabled-unselected-handle-opacity: 0.38;
  --md-comp-switch-disabled-selected-handle-color: var(--md-sys-color-surface);
  --md-comp-switch-disabled-selected-handle-opacity: 1;
  --md-comp-switch-state-layer-size: 40dp;
  --md-comp-switch-state-layer-shape: var(--md-sys-shape-corner-full);
  --md-comp-switch-unselected-hover-state-layer-color: var(--md-sys-color-on-surface);
  --md-comp-switch-unselected-hover-state-layer-opacity: var(
    --md-sys-state-hover-state-layer-opacity
  );
  --md-comp-switch-unselected-focus-state-layer-color: var(--md-sys-color-on-surface);
  --md-comp-switch-unselected-focus-state-layer-opacity: var(
    --md-sys-state-focus-state-layer-opacity
  );
  --md-comp-switch-unselected-pressed-state-layer-color: var(--md-sys-color-on-surface);
  --md-comp-switch-unselected-pressed-state-layer-opacity: var(
    --md-sys-state-pressed-state-layer-opacity
  );
  --md-comp-switch-selected-hover-state-layer-color: var(--md-sys-color-primary);
  --md-comp-switch-selected-hover-state-layer-opacity: var(
    --md-sys-state-hover-state-layer-opacity
  );
  --md-comp-switch-selected-focus-state-layer-color: var(--md-sys-color-primary);
  --md-comp-switch-selected-focus-state-layer-opacity: var(
    --md-sys-state-focus-state-layer-opacity
  );
  --md-comp-switch-selected-pressed-state-layer-color: var(--md-sys-color-primary);
  --md-comp-switch-selected-pressed-state-layer-opacity: var(
    --md-sys-state-pressed-state-layer-opacity
  );

  --md-private-switch-track-color: var(--md-comp-switch-unselected-track-color);
  --md-private-switch-track-outline-color: var(--md-comp-switch-unselected-track-outline-color);
  --md-private-switch-track-outline-width: var(--md-comp-switch-track-outline-width);
  --md-private-switch-track-opacity: 1;
  --md-private-switch-handle-width: var(--md-comp-switch-unselected-handle-width);
  --md-private-switch-handle-height: var(--md-comp-switch-unselected-handle-height);
  --md-private-switch-handle-color: var(--md-comp-switch-unselected-handle-color);
  --md-private-switch-handle-opacity: 1;
  --md-private-switch-handle-center-x: calc(var(--md-comp-switch-track-height) / 2);
  --md-private-state-layer-color: var(--md-comp-switch-unselected-hover-state-layer-color);
  --md-state-hover-layer-opacity: var(--md-comp-switch-unselected-hover-state-layer-opacity);
  --md-state-focus-layer-opacity: var(--md-comp-switch-unselected-focus-state-layer-opacity);
  --md-state-pressed-layer-opacity: var(--md-comp-switch-unselected-pressed-state-layer-opacity);

  position: relative;
  isolation: isolate;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  width: var(--md-comp-switch-track-width);
  height: var(--md-comp-switch-track-height);
  border: 0;
  border-radius: var(--md-comp-switch-track-shape);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &__target {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 0;
    display: block;
    width: var(--md-comp-switch-track-width);
    min-width: var(--md-comp-switch-track-width);
    height: 48dp;
    min-height: 48dp;
    transform: translate(-50%, -50%);
    background: transparent;
  }

  &__state-layer.md-state-layer {
    z-index: 1;
    top: 50%;
    left: calc(
      var(--md-private-switch-handle-center-x) - (var(--md-comp-switch-state-layer-size) / 2)
    );
    inset: auto;
    width: var(--md-comp-switch-state-layer-size);
    height: var(--md-comp-switch-state-layer-size);
    border-radius: var(--md-comp-switch-state-layer-shape);
    transform: translateY(-50%);
  }

  &__track {
    position: relative;
    z-index: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    border: var(--md-private-switch-track-outline-width) solid
      rgb(
        from var(--md-private-switch-track-outline-color) r g b /
          var(--md-private-switch-track-opacity)
      );
    border-radius: var(--md-comp-switch-track-shape);
    background-color: rgb(
      from var(--md-private-switch-track-color) r g b / var(--md-private-switch-track-opacity)
    );
    pointer-events: none;
    transition:
      background-color 0.1s,
      border-color 0.1s,
      border-width 0.1s;
  }

  &__handle {
    position: absolute;
    z-index: 2;
    top: 50%;
    left: calc(
      var(--md-private-switch-handle-center-x) - (var(--md-private-switch-handle-width) / 2)
    );
    width: var(--md-private-switch-handle-width);
    height: var(--md-private-switch-handle-height);
    border-radius: var(--md-comp-switch-handle-shape);
    background-color: rgb(
      from var(--md-private-switch-handle-color) r g b / var(--md-private-switch-handle-opacity)
    );
    transform: translateY(-50%);
    transition:
      width 0.1s,
      height 0.1s,
      left 0.1s,
      background-color 0.1s;
  }

  &__input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    opacity: 0;
    pointer-events: none;
  }

  &_selected {
    --md-private-switch-track-color: var(--md-comp-switch-selected-track-color);
    --md-private-switch-track-outline-color: transparent;
    --md-private-switch-track-outline-width: 0dp;
    --md-private-switch-handle-width: var(--md-comp-switch-selected-handle-width);
    --md-private-switch-handle-height: var(--md-comp-switch-selected-handle-height);
    --md-private-switch-handle-color: var(--md-comp-switch-selected-handle-color);
    --md-private-switch-handle-center-x: calc(
      var(--md-comp-switch-track-width) - (var(--md-comp-switch-track-height) / 2)
    );
    --md-private-state-layer-color: var(--md-comp-switch-selected-hover-state-layer-color);
    --md-state-hover-layer-opacity: var(--md-comp-switch-selected-hover-state-layer-opacity);
    --md-state-focus-layer-opacity: var(--md-comp-switch-selected-focus-state-layer-opacity);
    --md-state-pressed-layer-opacity: var(--md-comp-switch-selected-pressed-state-layer-opacity);
  }

  &_disabled {
    cursor: default;
    --md-private-switch-track-color: var(--md-comp-switch-disabled-unselected-track-color);
    --md-private-switch-track-outline-color: var(
      --md-comp-switch-disabled-unselected-track-outline-color
    );
    --md-private-switch-track-opacity: var(--md-comp-switch-disabled-track-opacity);
    --md-private-switch-handle-color: var(--md-comp-switch-disabled-unselected-handle-color);
    --md-private-switch-handle-opacity: var(--md-comp-switch-disabled-unselected-handle-opacity);

    &.md-switch_selected {
      --md-private-switch-track-color: var(--md-comp-switch-disabled-selected-track-color);
      --md-private-switch-track-outline-color: transparent;
      --md-private-switch-track-outline-width: 0dp;
      --md-private-switch-handle-color: var(--md-comp-switch-disabled-selected-handle-color);
      --md-private-switch-handle-opacity: var(--md-comp-switch-disabled-selected-handle-opacity);
    }
  }

  &_presentation {
    cursor: default;
    pointer-events: none;
  }

  &.md-state_hover {
    --md-private-switch-track-color: var(--md-comp-switch-unselected-hover-track-color);
    --md-private-switch-track-outline-color: var(
      --md-comp-switch-unselected-hover-track-outline-color
    );
    --md-private-switch-handle-color: var(--md-comp-switch-unselected-hover-handle-color);
    --md-private-state-layer-color: var(--md-comp-switch-unselected-hover-state-layer-color);

    &.md-switch_selected {
      --md-private-switch-track-color: var(--md-comp-switch-selected-hover-track-color);
      --md-private-switch-handle-color: var(--md-comp-switch-selected-hover-handle-color);
      --md-private-state-layer-color: var(--md-comp-switch-selected-hover-state-layer-color);
    }
  }

  &.md-state_focused {
    --md-private-switch-track-color: var(--md-comp-switch-unselected-focus-track-color);
    --md-private-switch-track-outline-color: var(
      --md-comp-switch-unselected-focus-track-outline-color
    );
    --md-private-switch-handle-color: var(--md-comp-switch-unselected-focus-handle-color);
    --md-private-state-layer-color: var(--md-comp-switch-unselected-focus-state-layer-color);

    &.md-switch_selected {
      --md-private-switch-track-color: var(--md-comp-switch-selected-focus-track-color);
      --md-private-switch-handle-color: var(--md-comp-switch-selected-focus-handle-color);
      --md-private-state-layer-color: var(--md-comp-switch-selected-focus-state-layer-color);
    }
  }

  &.md-state_pressed {
    --md-private-switch-track-color: var(--md-comp-switch-unselected-pressed-track-color);
    --md-private-switch-track-outline-color: var(
      --md-comp-switch-unselected-pressed-track-outline-color
    );
    --md-private-switch-handle-width: var(--md-comp-switch-pressed-handle-width);
    --md-private-switch-handle-height: var(--md-comp-switch-pressed-handle-height);
    --md-private-switch-handle-color: var(--md-comp-switch-unselected-pressed-handle-color);
    --md-private-state-layer-color: var(--md-comp-switch-unselected-pressed-state-layer-color);

    &.md-switch_selected {
      --md-private-switch-track-color: var(--md-comp-switch-selected-pressed-track-color);
      --md-private-switch-handle-color: var(--md-comp-switch-selected-pressed-handle-color);
      --md-private-state-layer-color: var(--md-comp-switch-selected-pressed-state-layer-color);
    }
  }
}
</style>
