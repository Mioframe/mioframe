<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { MDListItem } from '@shared/ui/Lists';

const props = withDefaults(
  defineProps<{
    headline: string;
    supportingText: string;
    checked: boolean;
    disabled?: boolean | undefined;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  change: [];
}>();

const onChange = () => {
  if (props.disabled) {
    return;
  }

  emit('change');
};

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled || !['Enter', ' '].includes(event.key)) {
    return;
  }

  event.preventDefault();
  onChange();
};
</script>

<template>
  <MDListItem
    :is="disabled ? 'div' : 'button'"
    :type="disabled ? false : 'button'"
    :item-role="disabled ? undefined : 'checkbox'"
    :headline="headline"
    :aria-checked="disabled ? undefined : checked"
    @click="onChange"
    @keydown="onKeydown"
  >
    <template #supportingText>
      {{ supportingText }}
    </template>

    <template #trailingIcon>
      <MDCheckbox presentation :model-value="checked" :disabled="disabled" />
    </template>
  </MDListItem>
</template>
