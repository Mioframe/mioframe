<script setup lang="ts">
import { useLocalSettings } from '@entity/localSettings';
import { useExampleDocumentsCreate } from '@feature/exampleDocumentsCreate';
import { MDButton, MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import type { AMDocumentId } from '@shared/lib/automerge';

const emit = defineEmits<{
  openDocument: [payload: { documentDirectory: string; documentId: AMDocumentId }];
}>();

const { settings } = useLocalSettings();
const {
  createShoppingExample,
  createWeeklyPlanExample,
  isCreatingShoppingExample,
  isCreatingWeeklyPlanExample,
  shoppingErrorMessage,
  weeklyPlanErrorMessage,
} = useExampleDocumentsCreate();

const onDismiss = () => {
  settings.value.hideStarterWidget = true;
};

const onOpenWeeklyPlan = async () => {
  const createdExample = await createWeeklyPlanExample();

  if (createdExample) {
    emit('openDocument', createdExample);
  }
};

const onOpenShopping = async () => {
  const createdExample = await createShoppingExample();

  if (createdExample) {
    emit('openDocument', createdExample);
  }
};
</script>

<template>
  <section class="starter-examples-widget">
    <div class="starter-examples-widget__header">
      <div class="starter-examples-widget__copy">
        <p class="starter-examples-widget__eyebrow">Start with a ready example</p>
        <h2 class="starter-examples-widget__headline">
          See how the app works before setting up your own system
        </h2>
        <p class="starter-examples-widget__supporting-text">
          Create a practical example you can keep and continue editing as your own.
        </p>
      </div>

      <MDIconButton tooltip="Hide starter examples" md-symbol-name="close" @click="onDismiss" />
    </div>

    <div class="starter-examples-widget__actions">
      <div class="starter-examples-widget__action">
        <div class="starter-examples-widget__action-copy">
          <h3 class="starter-examples-widget__action-title">Weekly planning</h3>
          <p class="starter-examples-widget__action-text">
            Open a ready weekly plan with linked statuses and realistic tasks.
          </p>
        </div>

        <MDButton
          label="Open Weekly Plan Example"
          color="tonal"
          :loading="isCreatingWeeklyPlanExample"
          :disabled="isCreatingWeeklyPlanExample || isCreatingShoppingExample"
          @click="onOpenWeeklyPlan"
        >
          <template #icon>
            <MDSymbol name="calendar_view_week" />
          </template>
        </MDButton>

        <p v-if="weeklyPlanErrorMessage" class="starter-examples-widget__error">
          {{ weeklyPlanErrorMessage }}
        </p>
      </div>

      <div class="starter-examples-widget__action">
        <div class="starter-examples-widget__action-copy">
          <h3 class="starter-examples-widget__action-title">Shopping example</h3>
          <p class="starter-examples-widget__action-text">
            Open a simple shopping list with linked purchase types and store-based views.
          </p>
        </div>

        <MDButton
          label="Open Shopping Example"
          color="filled"
          :loading="isCreatingShoppingExample"
          :disabled="isCreatingShoppingExample || isCreatingWeeklyPlanExample"
          @click="onOpenShopping"
        >
          <template #icon>
            <MDSymbol name="shopping_cart" />
          </template>
        </MDButton>

        <p v-if="shoppingErrorMessage" class="starter-examples-widget__error">
          {{ shoppingErrorMessage }}
        </p>
      </div>
    </div>
  </section>
</template>

<style lang="css" scoped>
.starter-examples-widget {
  padding: 20px;
  border-radius: 28px;
  background: linear-gradient(
    180deg,
    var(--md-sys-color-surface-container-high),
    var(--md-sys-color-surface-container)
  );
  color: var(--md-sys-color-on-surface);
  box-shadow: var(--md-sys-elevation-level1);
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__eyebrow {
    margin: 0;
    color: var(--md-sys-color-primary);
    font: var(--md-sys-typescale-label-medium-font);
    font-size: var(--md-sys-typescale-label-medium-size);
    line-height: var(--md-sys-typescale-label-medium-line-height);
    letter-spacing: var(--md-sys-typescale-label-medium-tracking);
    font-weight: var(--md-sys-typescale-label-medium-weight);
    text-transform: uppercase;
  }

  &__headline {
    margin: 0;
    font-family: var(--md-sys-typescale-headline-small-font);
    font-size: var(--md-sys-typescale-headline-small-size);
    line-height: var(--md-sys-typescale-headline-small-line-height);
    letter-spacing: var(--md-sys-typescale-headline-small-tracking);
    font-weight: var(--md-sys-typescale-headline-small-weight);
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
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  &__action {
    min-width: 0;
    padding: 16px;
    border-radius: 24px;
    background: color-mix(in srgb, var(--md-sys-color-surface-container-low) 80%, transparent);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__action-copy {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__action-title {
    margin: 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
    font-weight: var(--md-sys-typescale-title-medium-weight);
  }

  &__action-text {
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
