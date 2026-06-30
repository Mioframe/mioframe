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
    class="md-switch"
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
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  width: 52px;
  height: 32px;
  border: 0;
  border-radius: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &__state-layer {
    border-radius: 16px;
  }

  &__track {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    border: 2px solid var(--md-sys-color-outline);
    border-radius: 16px;
    background-color: transparent;
    pointer-events: none;
    transition:
      background-color 0.1s,
      border-color 0.1s;
  }

  &__thumb {
    width: 16px;
    height: 16px;
    margin-inline-start: 6px;
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
      width: 24px;
      height: 24px;
      margin-inline-start: 22px;
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
}
</style>
