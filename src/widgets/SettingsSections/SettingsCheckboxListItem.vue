<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { MDListItem } from '@shared/ui/Lists';

const { headline, supportingText, checked, disabled } = defineProps<{
  headline: string;
  supportingText: string;
  checked: boolean;
  disabled?: boolean | undefined;
}>();

const emit = defineEmits<{
  change: [];
}>();

const onChange = () => {
  if (disabled) {
    return;
  }

  emit('change');
};

const onKeydown = (event: KeyboardEvent) => {
  if (disabled || !['Enter', ' '].includes(event.key)) {
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
    item-role="checkbox"
    :headline="headline"
    :disabled="disabled"
    :aria-checked="checked"
    :aria-disabled="disabled ? 'true' : undefined"
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
