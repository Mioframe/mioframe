<script setup lang="ts" generic="T extends { labelText: string }">
import type { MaybeElement } from '@vueuse/core';
import { MDMenus, MDMenusListItem } from '../Menu';
import { MDTextField } from '../TextField';
import { computed, ref } from 'vue';
import { MDSymbol } from '../Icon';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';

const { multiple = false } = defineProps<{
  labelText: string;
  options: Iterable<T>;
  supportingText?: string;
  type?: 'filled' | 'outlined';
  disabled?: boolean;
  error?: boolean;
  multiple?: boolean;
}>();

const slots = defineSlots<{
  leadingIcon: (props: { option: T }) => unknown;
  trailingIcon: (props: { option: T }) => unknown;
}>();

const textFiledRef = ref<MaybeElement>();
const menusRef = ref<MaybeElement>();

const modelValue = defineModel<T[]>({
  default: [],
});

const printText = computed(() =>
  modelValue.value.map((option) => option.labelText).join(', '),
);

const showMenu = ref(false);

onInteractionOutside(
  textFiledRef,
  () => {
    showMenu.value = false;
  },
  {
    ignore: [menusRef],
  },
);

const onClickOption = (option: T) => {
  if (modelValue.value.includes(option)) {
    modelValue.value = modelValue.value.filter((value) => value !== option);
  } else {
    if (multiple) {
      modelValue.value.push(option);
    } else {
      modelValue.value = [option];
    }
  }
  showMenu.value = false;
};

// FIXME: добавить лёгкий поиск и навигацию клавиатурой
</script>

<template>
  <MDTextField
    ref="textFiledRef"
    v-model="printText"
    :label-text
    :supporting-text
    :type
    :disabled
    :error
    class="md-select"
    :class="{
      'md-select_open': showMenu,
    }"
    @focus="showMenu = true"
  >
    <template #trailingIcon>
      <MDSymbol name="arrow_drop_down" class="md-select__symbol-arrow" />
    </template>
  </MDTextField>

  <MDMenus v-if="showMenu" ref="menusRef" :target-ref="textFiledRef">
    <MDMenusListItem
      v-for="(option, optionIndex) in options"
      :key="optionIndex"
      :text="option.labelText"
      @click="onClickOption(option)"
    >
      <template v-if="!!slots.leadingIcon" #leadingIcon>
        <slot name="leadingIcon" :option />
      </template>

      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot name="trailingIcon" :option />
      </template>
    </MDMenusListItem>
  </MDMenus>
</template>

<style lang="css" scoped>
.md-select {
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
