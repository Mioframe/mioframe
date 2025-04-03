import type { Ref } from 'vue';

export const useBooleanEdit = (value: Ref<unknown>) => {
  const toggleBoolean = () => {
    value.value = value.value
      ? undefined
      : value.value === undefined
        ? false
        : true;
  };

  return {
    toggleBoolean,
  };
};
