<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import { MDCircularProgressIndicator } from '@shared/ui/material';
import { MDSymbol } from '@shared/ui/Icon';
import type { StarterExampleDefinition } from '@entity/starterExample';

const props = defineProps<{
  definition: StarterExampleDefinition;
  errorMessage: string | undefined;
  isBusy: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  create: [];
}>();

const onCreate = () => {
  emit('create');
};
</script>

<template>
  <MDListItem
    class="example-document-create-list-item"
    mode="single-action"
    :label-text="definition.title"
    :disabled="props.isBusy"
    :line-count="2"
    @action="onCreate"
  >
    <template #leading>
      <MDCircularProgressIndicator v-if="props.isLoading" :size="24" />
      <MDSymbol v-else :name="definition.iconName" />
    </template>

    <template #supportingText>
      <span
        v-if="props.errorMessage"
        class="example-document-create-list-item__error md-typescale-body-medium"
      >
        {{ props.errorMessage }}
      </span>
      <template v-else>{{ definition.description }}</template>
    </template>
  </MDListItem>
</template>

<style lang="css" scoped>
.example-document-create-list-item {
  &__error {
    color: var(--md-sys-color-error);
  }
}
</style>
