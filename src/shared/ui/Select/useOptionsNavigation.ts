import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { isObjectLike } from '@shared/lib/typeGuards';
import type { MaybeElement } from '@vueuse/core';
import {
  onKeyStroke,
  refAutoReset,
  unrefElement,
  useFocusWithin,
} from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap.mjs';
import { differenceWith, isEqual } from 'es-toolkit';
import { isArray } from 'es-toolkit/compat';
import type { Primitive } from 'type-fest';
import type { MaybeRef, MaybeRefOrGetter, ShallowRef } from 'vue';
import {
  computed,
  isRef,
  nextTick,
  ref,
  toValue,
  watch,
  watchEffect,
} from 'vue';

export const useOptionsNavigation = <
  T extends { labelText: string } | Primitive = { labelText: string },
>({
  options,
  optionsElements,
  fieldContainerRef,
  menuContainerRef,
  multiple,
  modelValue,
  optionToString = (option: T): string => {
    if (isObjectLike(option) && 'labelText' in option) {
      return option.labelText;
    }
    return String(option);
  },
}: {
  options: MaybeRefOrGetter<T[]>;
  optionsElements: ShallowRef<MaybeElement[] | null>;
  fieldContainerRef: ShallowRef<MaybeElement>;
  menuContainerRef: Readonly<ShallowRef<MaybeElement>>;
  multiple: MaybeRefOrGetter<boolean>;
  modelValue: MaybeRef<T[]>;
  optionToString?: (option: T) => string;
}) => {
  const showMenu = ref(false);
  const tempInput = refAutoReset<string | undefined>(undefined, 500);

  const { focused: focusedField } = useFocusWithin(fieldContainerRef);

  const filteredOptions = computed(() =>
    differenceWith(toValue(options), toValue(modelValue), isEqual),
  );

  watch(tempInput, (tempInput) => {
    if (tempInput) {
      const foundIndex = filteredOptions.value.findIndex((option) => {
        const labelText = optionToString(option).toLowerCase();

        return labelText.includes(tempInput);
      });

      if (foundIndex >= 0 && isArray(optionsElements.value)) {
        const foundRef = optionsElements.value.at(foundIndex);

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
    if (isRef(modelValue)) {
      modelValue.value = modelValue.value.filter(
        (value, index) => !(value === opt.value || index === opt.index),
      );
    }
  };

  onKeyStroke(true, ({ key }) => {
    if (focusedField.value || showMenu.value) {
      if (/^.$/.test(key)) {
        tempInput.value = tempInput.value ? tempInput.value + key : key;
      }

      if (key === 'Backspace' && isRef(modelValue)) {
        removeValue({ index: modelValue.value.length - 1 });
      }
    }
  });

  onKeyStroke('Escape', () => {
    showMenu.value = false;
  });

  onInteractionOutside(
    fieldContainerRef,
    () => {
      showMenu.value = false;
    },
    {
      ignore: [menuContainerRef],
    },
  );

  onKeyStroke(['ArrowDown', 'ArrowUp'], (e) => {
    if (focusedField.value) {
      e.preventDefault();
      showMenu.value = filteredOptions.value.length > 0;
    }
  });

  const {
    activate: activateMenuFocusTrap,
    deactivate: deactivateMenuFocusTrap,
  } = useFocusTrap(menuContainerRef, {
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

  const onClickFieldContainer = () => {
    showMenu.value = filteredOptions.value.length > 0;
  };

  onInteractionOutside(
    fieldContainerRef,
    () => {
      showMenu.value = false;
    },
    {
      ignore: [menuContainerRef],
    },
  );

  const onClickOption = (option: T) => {
    if (isRef(modelValue)) {
      if (modelValue.value.includes(option)) {
        modelValue.value = modelValue.value.filter((value) => value !== option);
      } else {
        if (toValue(multiple)) {
          modelValue.value = [...modelValue.value, option];
        } else {
          modelValue.value = [option];
        }
      }
    }

    showMenu.value = false;
  };

  return {
    showMenu,
    onClickFieldContainer,
    onClickOption,
    filteredOptions,
    removeValue,
    modelValue,
  };
};
