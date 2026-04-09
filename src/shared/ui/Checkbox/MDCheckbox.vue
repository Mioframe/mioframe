<script setup lang="ts">
import { computed, toRefs, toValue, useTemplateRef, watchEffect } from 'vue';
import { MDSymbol } from '../Icon';
import { isNil, isUndefined } from 'es-toolkit';
import { MDState } from '../State';
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
    autofocus?: boolean | undefined;
  }>(),
  {
    modelValue: undefined,
    id: () => sessionUniqueId('checkbox'),
  },
);

const { error, disabled, indeterminate, modelValue } = toRefs(props);

const emit = defineEmits<{
  'update:modelValue': [v: boolean | undefined];
  click: [];
}>();

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
  e.preventDefault();
  emit('click');

  stateValue.value = toggleBoolean(stateValue.value, toValue(indeterminate));
};

const inputEl = useTemplateRef('inputEl');

watchEffect(() => {
  if (inputEl.value) {
    inputEl.value.indeterminate = indeterminate.value && isUndefined(stateValue.value);
  }
});

const onKeydownContainer = ({ key }: KeyboardEvent) => {
  if (['Enter', ' '].includes(key)) {
    emit('click');

    stateValue.value = toggleBoolean(stateValue.value, toValue(indeterminate));
  }
};
</script>

<template>
  <MDState
    is="label"
    :for="id"
    class="md-checkbox"
    :class="{
      'md-checkbox_selected': stateValue === true,
      'md-checkbox_indeterminate': isNil(stateValue),
      'md-checkbox_error': error,
      'md-checkbox_disabled': disabled,
      'md-checkbox_readonly': readonly,
    }"
    :disabled="disabled"
    tabindex="0"
    :aria-label="tooltip"
    :autofocus="autofocus"
    @click="onClickContainer"
    @keydown="onKeydownContainer"
  >
    <input
      :id="id"
      ref="inputEl"
      v-model="stateValue"
      type="checkbox"
      :disabled="disabled"
      class="md-checkbox__input"
      tabindex="-1"
    />

    <div class="md md-checkbox__container">
      <MDSymbol v-if="symbolName" class="md-checkbox__icon" :name="symbolName" />
    </div>

    <MDPlainTooltip v-if="tooltip" :text="tooltip" />
  </MDState>
</template>

<style lang="css" scoped>
.md-checkbox {
  --md-state-display: inline-flex;
  --md-state-justify-content: center;
  --md-state-align-items: center;
  --md-state-width: 40px;
  --md-state-height: 40px;
  --md-state-border-radius: 20px;
  --md-state-border: 0;

  &__container {
    width: 18px;
    height: 18px;
    border-radius: 2px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid var(--md-sys-color-on-surface-variant);
    box-sizing: border-box;
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
    .md-checkbox__container {
      border-color: var(--md-sys-color-on-surface);
      --md-container-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
      --md-content-color: var(--md-sys-color-surface);
    }
  }

  &_readonly {
    .md-checkbox__container {
      border-color: var(--md-sys-color-secondary);
    }

    &.md-checkbox_indeterminate,
    &.md-checkbox_selected {
      pointer-events: none;

      .md-checkbox__container {
        --md-container-color: var(--md-sys-color-secondary);
        --md-content-color: var(--md-sys-color-on-secondary);
      }
    }
  }
}
</style>
