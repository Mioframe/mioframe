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
      <div class="md-switch__thumb" />
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
      <div class="md-switch__thumb" />
    </div>
  </label>
</template>

<style lang="css" scoped>
.md-switch {
  /*
   * Private implementation variables, not a public component-token contract.
   * No official `md.comp.switch.*` token paths are cached for this project
   * (see docs/material-3/component-registry.md); track/thumb geometry is
   * assumed from common Material switch conventions and kept as an
   * unresolved verification risk until official switch docs are available.
   */
  --md-switch-track-width: 52dp;
  --md-switch-track-height: 32dp;
  --md-switch-track-shape: 16dp;
  --md-switch-track-border-width: 2dp;
  --md-switch-thumb-size-unselected: 16dp;
  --md-switch-thumb-size-selected: 24dp;
  --md-switch-thumb-offset-unselected: 6dp;
  --md-switch-thumb-offset-selected: 22dp;

  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  width: var(--md-switch-track-width);
  height: var(--md-switch-track-height);
  border: 0;
  border-radius: var(--md-switch-track-shape);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &__state-layer {
    border-radius: var(--md-switch-track-shape);
  }

  &__track {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    border: var(--md-switch-track-border-width) solid var(--md-sys-color-outline);
    border-radius: var(--md-switch-track-shape);
    background-color: transparent;
    pointer-events: none;
    transition:
      background-color 0.1s,
      border-color 0.1s;
  }

  &__thumb {
    width: var(--md-switch-thumb-size-unselected);
    height: var(--md-switch-thumb-size-unselected);
    margin-inline-start: var(--md-switch-thumb-offset-unselected);
    border-radius: 50%;
    background-color: var(--md-sys-color-outline);
    transition:
      width 0.1s,
      height 0.1s,
      margin-inline-start 0.1s,
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
    .md-switch__track {
      border-color: transparent;
      background-color: var(--md-sys-color-primary);
    }

    .md-switch__thumb {
      width: var(--md-switch-thumb-size-selected);
      height: var(--md-switch-thumb-size-selected);
      margin-inline-start: var(--md-switch-thumb-offset-selected);
      background-color: var(--md-sys-color-on-primary);
    }
  }

  &_disabled {
    cursor: default;

    .md-switch__track {
      border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
    }

    .md-switch__thumb {
      background-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    &.md-switch_selected {
      .md-switch__track {
        border-color: transparent;
        background-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
      }

      .md-switch__thumb {
        background-color: var(--md-sys-color-surface);
      }
    }
  }

  &_presentation {
    cursor: default;
    pointer-events: none;
  }
}
</style>
