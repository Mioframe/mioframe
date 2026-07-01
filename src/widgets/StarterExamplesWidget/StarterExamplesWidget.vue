<script setup lang="ts">
import { computed } from 'vue';
import { starterExampleDefinitions, type StarterExampleId } from '@entity/starterExample';
import {
  ExampleDocumentCreateCard,
  markDatabaseExampleDocumentCreateSuccess,
  useExampleDocumentsCreate,
} from '@feature/exampleDocumentsCreate';
import { StarterExamplesDismissButton } from '@feature/starterExamplesDismiss';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDCard } from '@shared/ui/Card';

const emit = defineEmits<{
  createdDocument: [payload: { documentDirectory: string; documentId: AMDocumentId }];
}>();

const {
  createShoppingExample,
  createWeeklyPlanExample,
  isCreatingShoppingExample,
  isCreatingWeeklyPlanExample,
  shoppingErrorMessage,
  weeklyPlanErrorMessage,
} = useExampleDocumentsCreate();

const isBusy = computed(() => isCreatingWeeklyPlanExample.value || isCreatingShoppingExample.value);

const onCreateExample = async (exampleId: StarterExampleId) => {
  const createdExample =
    exampleId === 'weeklyPlan' ? await createWeeklyPlanExample() : await createShoppingExample();

  if (createdExample) {
    markDatabaseExampleDocumentCreateSuccess(
      createdExample.documentDirectory,
      createdExample.documentId,
    );
    emit('createdDocument', createdExample);
  }
};
</script>

<template>
  <MDCard class="starter-examples-widget" variant="outlined">
    <div class="starter-examples-widget__header">
      <div class="starter-examples-widget__copy">
        <p class="starter-examples-widget__eyebrow md-typescale-label-medium">
          Create a starter example
        </p>
        <h2 class="starter-examples-widget__headline md-typescale-title-small">
          Create a ready example before setting up your own system
        </h2>
        <p class="starter-examples-widget__supporting-text md-typescale-body-medium">
          Each option creates local documents in your Examples folder, opens them, and leaves them
          ready to keep editing.
        </p>
      </div>

      <StarterExamplesDismissButton />
    </div>

    <div class="starter-examples-widget__actions">
      <ExampleDocumentCreateCard
        v-for="definition in starterExampleDefinitions"
        :key="definition.id"
        class="starter-examples-widget__create-card"
        :definition="definition"
        :error-message="
          definition.id === 'weeklyPlan' ? weeklyPlanErrorMessage : shoppingErrorMessage
        "
        :is-busy="isBusy"
        :is-loading="
          definition.id === 'weeklyPlan' ? isCreatingWeeklyPlanExample : isCreatingShoppingExample
        "
        @create="onCreateExample(definition.id)"
      />
    </div>
  </MDCard>
</template>

<style lang="css" scoped>
.starter-examples-widget {
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
    color: var(--md-sys-color-on-surface-variant);
  }

  &__headline {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__actions {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(fit-content, 1fr));
    display: flex;
    flex-wrap: wrap;
  }

  &__create-card {
    width: min-content;
    flex-grow: 1;
  }
}
</style>
