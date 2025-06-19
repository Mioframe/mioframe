<script setup lang="ts" generic="T extends { labelText: string }">
import { onKeyStroke, useFocusWithin, type MaybeElement } from '@vueuse/core';
import { MDMenuContainer, MDMenusListItem } from '../Menu';
import { MDTextField } from '../TextField';
import { computed, nextTick, ref, useTemplateRef, watchEffect } from 'vue';
import { MDSymbol } from '../Icon';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';

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

const textFiledRef = useTemplateRef<MaybeElement>('textFiledRef');
const menusRef = useTemplateRef<MaybeElement>('menusRef');

const modelValue = defineModel<T[]>({
  default: [],
  required: true,
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

// FIXME: добавить лёгкий поиск
/**
 * Сделать классическую фильтрацию списка или повторить стандартный select?
 */

const onClickField = () => {
  showMenu.value = true;
};

const { focused: focusedField } = useFocusWithin(textFiledRef);

const { activate: activateMenuFocusTrap, deactivate: deactivateMenuFocusTrap } =
  useFocusTrap(menusRef, {
    isKeyForward: ({ key }) => ['Tab', 'ArrowDown', 'ArrowRight'].includes(key),
    isKeyBackward: ({ key }) => ['ArrowUp', 'ArrowLeft'].includes(key),
  });

watchEffect(() => {
  if (showMenu.value) {
    void nextTick(activateMenuFocusTrap);
  } else {
    void nextTick(deactivateMenuFocusTrap);
  }
});

onKeyStroke(['ArrowDown', 'ArrowUp'], () => {
  if (focusedField.value) {
    showMenu.value = true;
  }
});

onKeyStroke('Escape', () => {
  showMenu.value = false;
});

const hideSelection = ref(false);

const onFocusField = ({ currentTarget }: FocusEvent) => {
  hideSelection.value = true;
  if (currentTarget instanceof HTMLInputElement) {
    const length = currentTarget.value.length;
    void setTimeout(() => {
      currentTarget.setSelectionRange(length, length);
      hideSelection.value = false;
    }, 0);
  }
};
</script>

<template>
  <MDTextField
    ref="textFiledRef"
    :model-value="printText"
    readonly
    :label-text
    :supporting-text
    :type
    :disabled
    :error
    class="md-select"
    :class="{
      'md-select_open': showMenu,
      'md-select_hide-selection': hideSelection,
    }"
    @click="onClickField"
    @focus="onFocusField"
  >
    <template #trailingIcon>
      <MDSymbol name="arrow_drop_down" class="md-select__symbol-arrow" />
    </template>
  </MDTextField>

  <MDMenuContainer v-if="showMenu" ref="menusRef" :target-ref="textFiledRef">
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
  </MDMenuContainer>
</template>

<style lang="css" scoped>
.md-select {
  &_hide-selection {
    :deep() {
      input::selection {
        background: none;
      }
    }
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
