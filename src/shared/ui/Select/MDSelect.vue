<script setup lang="ts" generic="T extends SelectOption = SelectOption">
import { computed, ref, toRefs, toValue, useTemplateRef } from 'vue';
import { onKeyStroke, useFocusWithin, type MaybeElement } from '@vueuse/core';
import { MDMenu } from '../Menu';
import { MDSymbol } from '../Icon';
import { MDFieldContainer } from '../TextField';
import { MDChip } from '../Chips';
import { isNumber } from 'es-toolkit/compat';
import { differenceWith, isEqual } from 'es-toolkit';
import { shallowClone } from '@shared/lib/shallowClone';
import { isObjectLike } from '@shared/lib/typeGuards';
import type { SelectOption } from './types';

const props = defineProps<{
  labelText: string;
  options: T[];
  supportingText?: string;
  type?: 'filled' | 'outlined';
  disabled?: boolean;
  error?: boolean;
  multiple?: boolean;
}>();

const { multiple, options } = toRefs(props);

const modelValue = defineModel<T[]>({
  required: true,
});

defineSlots<{
  valueContainer: () => unknown;
}>();

const fieldContainerRef = useTemplateRef<MaybeElement>('fieldContainerRef');

const firstValue = computed(() => modelValue.value.at(0));

const optionToString = (option: T): string => {
  if (isObjectLike(option) && 'label' in option) {
    return option.label;
  }
  return String(option);
};

const showMenu = ref(false);

const { focused: focusedField } = useFocusWithin(fieldContainerRef);

const filteredOptions = computed(() =>
  differenceWith(toValue(options), toValue(modelValue), isEqual),
);

const removeOption = ({ index, option }: { option?: T; index?: number }) => {
  if (isNumber(index) && index >= 0) {
    const newValue = shallowClone(modelValue.value);

    newValue.splice(index, 1);

    modelValue.value = newValue;
  } else if (option) {
    modelValue.value = modelValue.value.filter((v) => v !== option);
  }
};

const addOption = (option: T) => {
  if (multiple.value) {
    modelValue.value = [...modelValue.value, option];
  } else {
    modelValue.value = [option];
  }
};

onKeyStroke('Backspace', () => {
  if (focusedField.value || showMenu.value) {
    removeOption({ index: modelValue.value.length - 1 });
  }
});

onKeyStroke('Escape', () => {
  showMenu.value = false;
});

onKeyStroke(['ArrowDown', 'ArrowUp'], (e) => {
  if (focusedField.value) {
    e.preventDefault();
    showMenu.value = filteredOptions.value.length > 0;
  }
});

const onClickFieldContainer = () => {
  showMenu.value = filteredOptions.value.length > 0;
};

const onClickOption = (option: T) => {
  if (modelValue.value.includes(option)) {
    removeOption({ option });
  } else {
    addOption(option);
  }

  showMenu.value = false;
};

const onClickValue = (option: T, index: number) => {
  removeOption({ index, option });
};

const onClickOutside = () => {
  showMenu.value = false;
};
</script>

<template>
  <div
    class="md-select"
    :class="{
      'md-select_open': showMenu,
      'md-field-container_focused': showMenu,
    }"
  >
    <MDFieldContainer
      ref="fieldContainerRef"
      :focused="showMenu ? true : undefined"
      :label-text="labelText"
      :supporting-text="supportingText"
      :type="type"
      :disabled="disabled"
      :error="error"
      class="md-select__field"
      :filled="modelValue.length > 0"
      @click="onClickFieldContainer"
    >
      <template #default>
        <div class="md-select__value-container" tabindex="0">
          <slot name="valueContainer">
            <template v-if="multiple">
              <MDChip
                v-for="(value, indexValue) in modelValue"
                :key="optionToString(value)"
                :label="optionToString(value)"
                type="input"
                @click="onClickValue(value, indexValue)"
                @click-close="onClickValue(value, indexValue)"
              />
            </template>

            <template v-else>
              <span v-if="firstValue">
                {{ optionToString(firstValue) }}
              </span>
            </template>
          </slot>
        </div>
      </template>

      <template #trailingIcon>
        <MDSymbol name="arrow_drop_down" class="md-select__symbol-arrow" />
      </template>
    </MDFieldContainer>

    <MDMenu
      v-if="showMenu"
      show
      :target-el="fieldContainerRef"
      :btns="options"
      @click="onClickOption"
      @click-outside="onClickOutside"
    />
  </div>
</template>

<style lang="css" scoped>
.md-select {
  &__field {
    cursor: pointer;
  }

  &__value-container {
    all: unset;
    display: flex;
    flex-wrap: wrap;
    gap: 2step 3step;
    cursor: pointer;
  }

  &__symbol-arrow {
    transition-property: transform;
    transition-duration: var(--md-sys-motion-duration-short4);
  }

  &.md-select_open {
    .md-select__symbol-arrow {
      transform: rotateX(180deg);
    }
  }
}
</style>
