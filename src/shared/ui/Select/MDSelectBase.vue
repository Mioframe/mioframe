<script setup lang="ts" generic="Value extends string | number = string | number">
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import { onKeyStroke, useFocusWithin, type MaybeElement } from '@vueuse/core';
import { MDMenuBase } from '../Menu';
import { MDSymbol } from '../Icon';
import { MDFieldContainer } from '../TextField';
import { MDInputChip } from '../Chips';
import { toString } from 'es-toolkit/compat';
import { sessionUniqueId } from '@shared/lib/uniqueId';
import { useSelectOptions } from './provideOptions';

const modelValue = defineModel<Value[]>({
  required: true,
});

const props = defineProps<{
  labelText: string;
  supportingText?: string | undefined;
  type?: 'filled' | 'outlined' | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  multiple?: boolean | undefined;
}>();

defineSlots<{
  valueContainer: () => unknown;
  options: () => unknown;
}>();

const { multiple } = toRefs(props);

const fieldContainerRef = useTemplateRef<MaybeElement>('fieldContainerRef');

const firstValue = computed(() => modelValue.value.at(0));

const valueToString = (value: Value): string => {
  return options.get(value) ?? toString(value);
};

const showMenu = ref(false);

const { focused: focusedField } = useFocusWithin(fieldContainerRef);

const removeOption = (value: Value) => {
  modelValue.value = modelValue.value.filter((v) => v !== value);
};

const addOption = (value: Value) => {
  if (multiple.value) {
    modelValue.value = [...modelValue.value, value];
  } else {
    modelValue.value = [value];
  }
};

onKeyStroke('Backspace', () => {
  if (focusedField.value || showMenu.value) {
    const lastValue = modelValue.value.at(-1);
    if (lastValue !== undefined) {
      removeOption(lastValue);
    }
  }
});

const onClickOption = (value: Value) => {
  if (modelValue.value.some((v) => v === value)) {
    removeOption(value);
  } else {
    addOption(value);
  }

  if (!multiple.value) {
    showMenu.value = false;
  }
};

const options = useSelectOptions<Value>(onClickOption);

onKeyStroke(['ArrowDown', 'ArrowUp'], (e) => {
  if (focusedField.value) {
    e.preventDefault();
    showMenu.value = true;
  }
});

const onClickFieldContainer = () => {
  showMenu.value = !showMenu.value;
};

const onClickValue = (value: Value) => {
  removeOption(value);
};

const onClickOutside = () => {
  showMenu.value = false;
};

const selectId = sessionUniqueId('select');
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
      :id="selectId"
      ref="fieldContainerRef"
      :focused="showMenu ? true : undefined"
      :label-text="labelText"
      :supporting-text="supportingText"
      :type="type"
      :disabled="disabled"
      :error="error"
      class="md-select__field"
      :filled="modelValue.length > 0"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="showMenu ? 'true' : 'false'"
      :aria-controls="selectId"
      :aria-label="labelText"
      @click="onClickFieldContainer"
    >
      <template #default>
        <div class="md-select__value-container md-focus-indicator_hidden" tabindex="0">
          <slot name="valueContainer">
            <template v-if="multiple">
              <MDInputChip
                v-for="value in modelValue"
                :key="valueToString(value)"
                :label="valueToString(value)"
                @click="() => onClickValue(value)"
                @click-close="() => onClickValue(value)"
              />
            </template>

            <template v-else>
              <span v-if="firstValue">
                {{ valueToString(firstValue) }}
              </span>
            </template>
          </slot>
        </div>
      </template>

      <template #trailingIcon>
        <MDSymbol name="arrow_drop_down" class="md-select__symbol-arrow" />
      </template>
    </MDFieldContainer>

    <MDMenuBase
      v-model:show="showMenu"
      :target="fieldContainerRef"
      role="listbox"
      @interaction-outside="onClickOutside"
    >
      <template #default>
        <slot name="options" />
      </template>
    </MDMenuBase>
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
    -webkit-tap-highlight-color: transparent;
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
