<script
  setup
  lang="ts"
  generic="T extends { labelText: string } = { labelText: string }"
>
import {
  computed,
  nextTick,
  ref,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import {
  onKeyStroke,
  refAutoReset,
  unrefElement,
  useFocusWithin,
  type MaybeElement,
} from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { MDMenuContainer, MDMenusListItem } from '../Menu';
import { MDSymbol } from '../Icon';
import { MDFieldContainer } from '../TextField';
import { MDChip } from '../Chips';
import { isArray } from 'es-toolkit/compat';
import { differenceWith, isEqual } from 'es-toolkit';

const { multiple = false, options } = defineProps<{
  labelText: string;
  options: T[];
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

const modelValue = defineModel<T[]>({
  default: [],
  required: true,
});

const fieldContainerRef = useTemplateRef<MaybeElement>('fieldContainerRef');
const menusRef = useTemplateRef<MaybeElement>('menusRef');

const filteredOptions = computed(() =>
  differenceWith(options, modelValue.value, isEqual),
);

const showMenu = ref(false);

onInteractionOutside(
  fieldContainerRef,
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

const onClickField = () => {
  showMenu.value = true;
};

const { focused: focusedField } = useFocusWithin(fieldContainerRef);

const { activate: activateMenuFocusTrap, deactivate: deactivateMenuFocusTrap } =
  useFocusTrap(menusRef, {
    isKeyForward: ({ key }) => ['Tab', 'ArrowDown', 'ArrowRight'].includes(key),
    isKeyBackward: ({ key }) => ['ArrowUp', 'ArrowLeft'].includes(key),
    allowOutsideClick: true,
  });

watchEffect(() => {
  if (showMenu.value) {
    void nextTick(activateMenuFocusTrap);
  } else {
    void nextTick(deactivateMenuFocusTrap);
  }
});

onKeyStroke(['ArrowDown', 'ArrowUp'], (e) => {
  if (focusedField.value) {
    e.preventDefault();
    showMenu.value = true;
  }
});

onKeyStroke('Escape', () => {
  showMenu.value = false;
});

const firstValue = computed(() => modelValue.value.at(0));

const tempInput = refAutoReset<string | undefined>(undefined, 500);

const optionsRef = useTemplateRef('optionsRef');

watch(tempInput, (tempInput) => {
  if (tempInput) {
    const foundIndex = filteredOptions.value.findIndex(({ labelText }) =>
      labelText.includes(tempInput),
    );

    if (foundIndex >= 0 && isArray(optionsRef.value)) {
      const foundRef = optionsRef.value.at(foundIndex);

      if (foundRef) {
        const foundEl = unrefElement(foundRef);

        if (foundEl instanceof HTMLElement) {
          foundEl.focus();
        }
      }
    }
  }
});

const removeValue = (opt: { value?: T; index?: number }) => {
  modelValue.value = modelValue.value.filter(
    (value, index) => !(value === opt.value || index === opt.index),
  );
};

onKeyStroke(true, ({ key }) => {
  if (focusedField.value || showMenu.value) {
    if (/^.$/.test(key)) {
      tempInput.value = tempInput.value ? tempInput.value + key : key;
    }

    if (key === 'Backspace') {
      removeValue({ index: modelValue.value.length - 1 });
    }
  }
});

const onClickValue = (value: T, index: number) => {
  removeValue({ index, value });
};
</script>

<template>
  <MDFieldContainer
    ref="fieldContainerRef"
    :label-text
    :supporting-text
    :type
    :disabled
    :error
    class="md-select"
    :class="{
      'md-select_open': showMenu,
      'md-field-container_focused': showMenu,
    }"
    :filled="modelValue.length > 0"
    @click="onClickField"
  >
    <template #default>
      <div class="md-select__value-container" tabindex="0">
        <template v-if="multiple">
          <MDChip
            v-for="(value, indexValue) in modelValue"
            :key="value.labelText"
            :label="value.labelText"
            type="input"
            @click.stop="onClickValue(value, indexValue)"
          />
        </template>

        <template v-else>
          <span v-if="firstValue">
            {{ firstValue.labelText }}
          </span>
        </template>

        {{ tempInput }}
      </div>
    </template>

    <template #trailingIcon>
      <MDSymbol name="arrow_drop_down" class="md-select__symbol-arrow" />
    </template>
  </MDFieldContainer>

  <MDMenuContainer
    v-if="showMenu"
    ref="menusRef"
    :target-ref="fieldContainerRef"
  >
    <MDMenusListItem
      v-for="option in filteredOptions"
      :key="option.labelText"
      ref="optionsRef"
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
  cursor: pointer;

  &__value-container {
    all: unset;
    display: flex;
    flex-wrap: wrap;
    gap: 1step;
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
