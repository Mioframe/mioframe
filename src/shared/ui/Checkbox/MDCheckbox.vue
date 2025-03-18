<script setup lang="ts">
import { computed } from 'vue';
import { MDSymbol } from '../Icon';
import { isUndefined } from 'lodash-es';

const {
  error,
  disabled,
  indeterminate,
  modelValue = undefined,
} = defineProps<{
  error?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  modelValue?: boolean | undefined;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean | undefined];
}>();

const stateValue = computed({
  get: () => {
    if (indeterminate) {
      return modelValue;
    }
    return !!modelValue;
  },
  set: (v: boolean | undefined) => {
    emit('update:modelValue', v);
  },
});

const symbolName = computed(() =>
  stateValue.value === undefined
    ? 'remove'
    : stateValue.value
      ? 'check'
      : undefined,
);

const onClickContainer = () => {
  if (indeterminate) {
    stateValue.value = stateValue.value
      ? undefined
      : stateValue.value === undefined
        ? false
        : true;
  } else {
    stateValue.value = !stateValue.value;
  }
};
</script>

<template>
  <div
    class="md-checkbox"
    :class="{
      'md-checkbox_selected': stateValue === true,
      'md-checkbox_indeterminate': isUndefined(stateValue),
      'md-checkbox_error': error,
      'md-checkbox_disabled': disabled,
    }"
  >
    <input
      v-model="stateValue"
      type="checkbox"
      :disabled
      class="md-checkbox__input"
    />

    <button
      type="button"
      class="md-checkbox__container"
      @click="onClickContainer"
    >
      <MDSymbol
        v-if="symbolName"
        class="md-checkbox__icon"
        :name="symbolName"
      />
    </button>
  </div>
</template>

<style lang="css" scoped>
.md-checkbox {
  display: inline-block;
  width: 40px;
  height: 40px;
  border-radius: 20px;

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
    pointer-events: none;
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
      --md-container-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
      --md-content-color: var(--md-sys-color-surface);
    }
  }
}
</style>
