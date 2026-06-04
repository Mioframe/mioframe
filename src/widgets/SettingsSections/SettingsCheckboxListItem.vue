<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { MDListItem } from '@shared/ui/Lists';

const { headline, supportingText, checked, disabled, readonly, lines } = defineProps<{
  headline: string;
  supportingText: string;
  checked: boolean;
  disabled?: boolean | undefined;
  /** When true, renders as non-interactive: visually checked, no button/ripple, aria-readonly. */
  readonly?: boolean | undefined;
  lines?: 1 | 2 | 3 | undefined;
}>();

const emit = defineEmits<{
  change: [];
}>();

const onChange = () => {
  if (disabled || readonly) {
    return;
  }

  emit('change');
};

const onKeydown = (event: KeyboardEvent) => {
  if (disabled || readonly || !['Enter', ' '].includes(event.key)) {
    return;
  }

  event.preventDefault();
  onChange();
};
</script>

<template>
  <MDListItem
    :is="disabled || readonly ? 'div' : 'button'"
    :type="disabled || readonly ? false : 'button'"
    item-role="checkbox"
    :headline="headline"
    :disabled="disabled"
    :lines="lines"
    :aria-checked="checked"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-readonly="readonly ? 'true' : undefined"
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
