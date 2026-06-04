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

const onKeydown = (event: KeyboardEvent) => {
  if (disabled || loading || !['Enter', ' '].includes(event.key)) {
    return;
  }

  event.preventDefault();
  onChange();
};
</script>

<template>
  <MDListItem
    :is="disabled || loading ? 'div' : 'button'"
    :type="disabled || loading ? false : 'button'"
    item-role="checkbox"
    :headline="headline"
    :disabled="disabled || loading"
    :lines="lines"
    :aria-checked="checked"
    :aria-disabled="disabled || loading ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    @click="onChange"
    @keydown="onKeydown"
  >
    <template #supportingText>
      {{ supportingText }}
    </template>

    <template #trailingIcon>
      <MDCircularProgressIndicator v-if="loading" :size="24" />
      <MDCheckbox v-else presentation :model-value="checked" :disabled="disabled" />
    </template>
  </MDListItem>
</template>
