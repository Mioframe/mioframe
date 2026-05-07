<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { MDListItem } from '@shared/ui/Lists';

const props = defineProps<{
  headline: string;
  supportingText: string;
  checked: boolean;
  disabled?: boolean | undefined;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const onToggle = () => {
  if (props.disabled) {
    return;
  }

  emit('toggle');
};
</script>

<template>
  <MDListItem is="button" type="button" :headline="headline" @click="onToggle">
    <template #supportingText>
      {{ supportingText }}
    </template>

    <template #trailingIcon>
      <MDCheckbox
        :model-value="checked"
        :disabled="disabled"
        :aria-label="headline"
        @update:model-value="onToggle"
      />
    </template>
  </MDListItem>
</template>
