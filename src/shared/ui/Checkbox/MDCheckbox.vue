<script setup lang="ts">
import { computed, toRefs, toValue, useTemplateRef, watchEffect } from 'vue';
import { MDSymbol } from '../Icon';
import { isNil, isUndefined } from 'es-toolkit';
import { MDStateLayer, useStateLayer } from '../State';
import { toggleBoolean } from './toggleBoolean';
import { sessionUniqueId } from '@shared/lib/uniqueId';
import { MDPlainTooltip } from '../Tooltips';

const props = withDefaults(
  defineProps<{
    error?: boolean | undefined;
    disabled?: boolean | undefined;
    indeterminate?: boolean | undefined;
    modelValue?: boolean | undefined;
    id?: string | undefined;
    readonly?: boolean | undefined;
    tooltip?: string | undefined;
    ariaLabel?: string | undefined;
    autofocus?: boolean | undefined;
    tabIndex?: number | undefined;
    presentation?: boolean | undefined;
  }>(),
  {
    modelValue: undefined,
    id: () => sessionUniqueId('checkbox'),
    tabIndex: 0,
  },
);

const emit = defineEmits<{
  'update:modelValue': [v: boolean | undefined];
  click: [];
}>();

const { error, disabled, indeterminate, modelValue, presentation, readonly } = toRefs(props);

const stateValue = computed({
  get: () => {
    if (indeterminate.value) {
      return modelValue.value;
    }
    return !!modelValue.value;
  },
  set: (v: boolean | undefined) => {
    emit('update:modelValue', v);
  },
});

const symbolName = computed(() =>
  stateValue.value === undefined ? 'remove' : stateValue.value ? 'check' : undefined,
);

const onClickContainer = (e: MouseEvent) => {
  if (presentation.value) {
    return;
  }

  if (disabled.value) {
    return;
  }

  e.preventDefault();
  emit('click');

  if (readonly.value) {
    return;
  }

  e.stopPropagation();
  stateValue.value = toggleBoolean(stateValue.value, toValue(indeterminate));
};

const inputEl = useTemplateRef('inputEl');

watchEffect(() => {
  if (inputEl.value) {
    inputEl.value.indeterminate = indeterminate.value && isUndefined(stateValue.value);
  }
});

const onKeydownContainer = (event: KeyboardEvent) => {
  if (presentation.value) {
    return;
  }

  const { key } = event;
  if (!['Enter', ' '].includes(key)) {
    return;
  }

  if (disabled.value) {
    return;
  }

  event.preventDefault();
  emit('click');

  if (readonly.value) {
    return;
  }

  event.stopPropagation();
  stateValue.value = toggleBoolean(stateValue.value, toValue(indeterminate));
};

const checkboxEl = useTemplateRef<HTMLElement>('checkboxEl');
const { hover, focused, durationPressedState } = useStateLayer(checkboxEl, {
  disabled,
  autofocus: () => props.autofocus,
  enableRipple: () => !presentation.value && !disabled.value,
});
</script>

<template>
  <div
    v-if="presentation"
    class="md-checkbox"
    :class="{
      'md-checkbox_selected': stateValue === true,
      'md-checkbox_indeterminate': isNil(stateValue),
      'md-checkbox_error': error,
      'md-checkbox_disabled': disabled,
      'md-checkbox_presentation': presentation,
      'md-checkbox_readonly': readonly,
    }"
    aria-hidden="true"
  >
    <div class="md md-checkbox__container">
      <MDSymbol v-if="symbolName" class="md-checkbox__icon" :name="symbolName" />
    </div>

    <MDPlainTooltip v-if="tooltip" :text="tooltip" />
  </div>

  <label
    v-else
    ref="checkboxEl"
    :for="id"
    class="md-checkbox"
    :class="{
      'md-checkbox_selected': stateValue === true,
      'md-checkbox_indeterminate': isNil(stateValue),
      'md-checkbox_error': error,
      'md-checkbox_disabled': disabled,
      'md-checkbox_presentation': presentation,
      'md-checkbox_readonly': readonly,
      'md-state_hover': hover,
      'md-state_focused': focused,
      'md-state_pressed': durationPressedState,
      'md-state_disabled': disabled,
    }"
    :tabindex="tabIndex"
    :aria-label="tooltip ?? ariaLabel"
    @click="onClickContainer"
    @keydown="onKeydownContainer"
  >
    <MDStateLayer
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :disabled="disabled"
    />

    <input
      :id="id"
      ref="inputEl"
      v-model="stateValue"
      type="checkbox"
      :disabled="disabled"
      :aria-label="ariaLabel"
      class="md-checkbox__input"
      tabindex="-1"
    />

    <div class="md md-checkbox__container">
      <MDSymbol v-if="symbolName" class="md-checkbox__icon" :name="symbolName" />
    </div>

    <MDPlainTooltip v-if="tooltip" :text="tooltip" />
  </label>
</template>

<style lang="css" scoped>
.md-checkbox {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 20px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &__container {
    position: relative;
    z-index: 1;
    width: 18px;
    height: 18px;
    border-radius: 2px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid var(--md-sys-color-on-surface-variant);
    box-sizing: border-box;
    cursor: pointer;
  }

  &__icon {
    --md-symbol-opsz: 18;
    width: 18px;
    height: 18px;
    font-size: 18px;
  }

  &__input {
    opacity: 0;
    /* pointer-events: none; */
    background-color: transparent;
    position: absolute;
  }

  &_indeterminate,
  &_selected {
    .md-checkbox__container {
      --md-container-color: var(--md-sys-color-primary);
      --md-content-color: var(--md-sys-color-on-primary);
      border-width: 0;
    }
  }

  &_error {
    .md-checkbox__container {
      --md-container-color: var(--md-sys-color-error);
      --md-content-color: var(--md-sys-color-on-error);
      border-color: var(--md-sys-color-error);
    }
  }

  &_disabled {
    cursor: default;

    .md-checkbox__container {
      border-color: var(--md-sys-color-on-surface);
      --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-content-color: var(--md-sys-color-surface);
      cursor: default;
    }
  }

  &_readonly {
    cursor: default;

    .md-checkbox__container {
      border-color: var(--md-sys-color-secondary);
      cursor: default;
    }

    &.md-checkbox_indeterminate,
    &.md-checkbox_selected {
      .md-checkbox__container {
        --md-container-color: var(--md-sys-color-secondary);
        --md-content-color: var(--md-sys-color-on-secondary);
      }
    }
  }

  &_presentation {
    cursor: default;

    .md-checkbox__container {
      cursor: default;
    }
  }
}
</style>
