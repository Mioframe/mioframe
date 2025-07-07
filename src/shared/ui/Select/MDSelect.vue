<script
  setup
  lang="ts"
  generic="T extends { labelText: string } | Primitive = { labelText: string }"
>
import { computed, toRefs, useTemplateRef } from 'vue';
import { type MaybeElement } from '@vueuse/core';
import { MDMenuContainer } from '../Menu';
import { MDSymbol } from '../Icon';
import { MDFieldContainer } from '../TextField';
import { MDChip } from '../Chips';
import { isObject } from 'es-toolkit/compat';
import type { Primitive } from 'type-fest';
import { MDListItem } from '../Lists';
import { useOptionsNavigation } from './useOptionsNavigation';

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

const slots = defineSlots<{
  leadingIcon: (props: { option: T }) => unknown;
  trailingIcon: (props: { option: T }) => unknown;
}>();

const modelValue = defineModel<T[]>({
  default: [],
  required: true,
});

const fieldContainerRef = useTemplateRef<MaybeElement>('fieldContainerRef');
const menuContainerRef = useTemplateRef<MaybeElement>('menuContainerRef');
const optionsElements = useTemplateRef<MaybeElement[]>('optionsRef');

const firstValue = computed(() => modelValue.value.at(0));

const optionToString = (v: T): string => {
  if (isObject(v) && 'labelText' in v) {
    return v.labelText;
  }
  return String(v);
};

const {
  showMenu,
  onClickFieldContainer,
  onClickOption,
  filteredOptions,
  removeValue,
} = useOptionsNavigation({
  options,
  optionsElements,
  fieldContainerRef,
  menuContainerRef,
  multiple,
  modelValue,
  optionToString,
});

const onClickValue = (value: T, index: number) => {
  removeValue({ index, value });
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
      :focused="showMenu"
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
        </div>
      </template>

      <template #trailingIcon>
        <MDSymbol name="arrow_drop_down" class="md-select__symbol-arrow" />
      </template>
    </MDFieldContainer>

    <MDMenuContainer
      v-if="showMenu"
      ref="menuContainerRef"
      :target-ref="fieldContainerRef"
    >
      <MDListItem
        is="button"
        v-for="option in filteredOptions"
        :key="optionToString(option)"
        ref="optionsElements"
        :headline="optionToString(option)"
        type="button"
        @click="onClickOption(option)"
      >
        <template v-if="!!slots.leadingIcon" #leadingIcon>
          <slot name="leadingIcon" :option="option" />
        </template>

        <template v-if="!!slots.trailingIcon" #trailingIcon>
          <slot name="trailingIcon" :option="option" />
        </template>
      </MDListItem>
    </MDMenuContainer>
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
