<script setup lang="ts">
import { MDButton } from '@shared/ui/Button';
import { MDCard } from '@shared/ui/Card';
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
  <MDCard class="example-document-create-card" variant="elevated">
    <div class="example-document-create-card__copy">
      <h3 class="example-document-create-card__title md-typescale-title-medium">
        {{ definition.title }}
      </h3>
      <p class="example-document-create-card__text md-typescale-body-medium">
        {{ definition.description }}
      </p>
    </div>

    <MDButton
      :label="definition.buttonLabel"
      :color="definition.buttonColor"
      :loading="props.isLoading"
      :disabled="props.isBusy"
      @click="onCreate"
    >
      <template #icon>
        <MDSymbol :name="definition.iconName" />
      </template>
    </MDButton>

    <p
      v-if="props.errorMessage"
      class="example-document-create-card__error md-typescale-body-small"
    >
      {{ props.errorMessage }}
    </p>
  </MDCard>
</template>

<style lang="css" scoped>
.example-document-create-card {
  min-width: min-content;

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__title {
    margin: 0;
  }

  &__text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__error {
    margin: 0;
    color: var(--md-sys-color-error);
  }
}
</style>
