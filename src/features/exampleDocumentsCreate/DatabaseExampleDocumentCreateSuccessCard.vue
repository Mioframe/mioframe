<script setup lang="ts">
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';

const emit = defineEmits<{
  dismiss: [];
}>();

const onDismiss = () => {
  emit('dismiss');
};
</script>

<template>
  <MDCard class="database-example-document-create-success-card" variant="outlined">
    <div class="database-example-document-create-success-card__content">
      <h3 class="database-example-document-create-success-card__headline">Example created</h3>
      <p class="database-example-document-create-success-card__supporting-text">
        This is a regular Mioframe document. You can edit rows or add your own records.
      </p>
    </div>

    <div class="database-example-document-create-success-card__actions">
      <MDButton label="Got it" color="text" @click="onDismiss" />
    </div>
  </MDCard>
</template>

<style lang="css" scoped>
.database-example-document-create-success-card {
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 4dp;
  }

  &__headline {
    margin: 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
    font-weight: var(--md-sys-typescale-title-medium-weight);
  }

  &__supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
    font-weight: var(--md-sys-typescale-body-medium-weight);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
