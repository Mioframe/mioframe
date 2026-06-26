<script setup lang="ts">
import { MDSwitch } from '@shared/ui/Switch';
import { MDListItem } from '@shared/ui/Lists';

const { headline, supportingText, checked, disabled, lines } = defineProps<{
  headline: string;
  supportingText: string;
  checked: boolean;
  disabled?: boolean | undefined;
  lines?: 1 | 2 | 3 | undefined;
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
</script>

<template>
  <MDListItem
    mode="single-action"
    role="switch"
    :label-text="headline"
    :supporting-text="supportingText"
    :disabled="disabled"
    :line-count="lines"
    :aria-checked="checked"
    :aria-disabled="disabled ? 'true' : undefined"
    @action="onChange"
  >
    <template #trailing>
      <MDSwitch presentation :model-value="checked" :disabled="disabled" />
    </template>
  </MDListItem>
</template>
