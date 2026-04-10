import { toValue, type MaybeRef, type Ref } from 'vue';

export const toggleBoolean = (value: boolean | undefined, indeterminate?: boolean) => {
  if (indeterminate) {
    if (value) {
      return undefined;
    }

    return value !== undefined;
  }

  return !value;
};

export const useBooleanEdit = (
  value: Ref<boolean | undefined>,
  indeterminate?: MaybeRef<boolean | undefined>,
) => {
  const toggle = () => {
    value.value = toggleBoolean(value.value, toValue(indeterminate));
  };

  return {
    toggleBoolean: toggle,
  };
};
