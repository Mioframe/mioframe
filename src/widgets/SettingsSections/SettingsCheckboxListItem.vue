<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { MDListItem } from '@shared/ui/Lists';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';

const { headline, supportingText, checked, disabled, loading, lines } = defineProps<{
  headline: string;
  supportingText: string;
  checked: boolean;
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  lines?: 1 | 2 | 3 | undefined;
}>();

const emit = defineEmits<{
  change: [];
}>();

const onChange = () => {
  if (disabled || loading) {
    return;
  }

  emit('change');
};
</script>

<template>
  <MDListItem
    mode="single-action"
    role="checkbox"
    :label-text="headline"
    :supporting-text="supportingText"
    :disabled="disabled || loading"
    :line-count="lines"
    :selected="checked"
    :aria-checked="checked"
    :aria-disabled="disabled || loading ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    @action="onChange"
  >
    <template #trailing>
      <MDCircularProgressIndicator v-if="loading" :size="24" />
      <MDCheckbox v-else presentation :model-value="checked" :disabled="disabled" />
    </template>
  </MDListItem>
</template>
