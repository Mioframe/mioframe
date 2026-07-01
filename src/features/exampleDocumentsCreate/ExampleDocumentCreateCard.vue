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
      <h3 class="example-document-create-card__title">{{ definition.title }}</h3>
      <p class="example-document-create-card__text">
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

    <p v-if="props.errorMessage" class="example-document-create-card__error">
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
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
    font-weight: var(--md-sys-typescale-title-medium-weight);
  }

  &__text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
    font-weight: var(--md-sys-typescale-body-medium-weight);
  }

  &__error {
    margin: 0;
    color: var(--md-sys-color-error);
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    line-height: var(--md-sys-typescale-body-small-line-height);
    letter-spacing: var(--md-sys-typescale-body-small-tracking);
    font-weight: var(--md-sys-typescale-body-small-weight);
  }
}
</style>
