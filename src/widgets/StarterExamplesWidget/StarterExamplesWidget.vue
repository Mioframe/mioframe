<script setup lang="ts">
import { computed } from 'vue';
import { starterExampleDefinitions, type StarterExampleId } from '@entity/starterExample';
import {
  ExampleDocumentCreateListItem,
  markDatabaseExampleDocumentCreateSuccess,
  useExampleDocumentsCreate,
} from '@feature/exampleDocumentsCreate';
import { StarterExamplesDismissButton } from '@feature/starterExamplesDismiss';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDCard } from '@shared/ui/Card';
import { MDList } from '@shared/ui/Lists';

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
  <MDCard
    class="starter-examples-widget"
    variant="outlined"
    role="region"
    aria-labelledby="starter-examples-widget-heading"
  >
    <div class="starter-examples-widget__header">
      <div class="starter-examples-widget__copy">
        <h2
          id="starter-examples-widget-heading"
          class="starter-examples-widget__heading md-typescale-title-small"
        >
          Starter examples
        </h2>
        <p class="starter-examples-widget__supporting-text md-typescale-body-medium">
          Create local example documents to start editing.
        </p>
      </div>

      <StarterExamplesDismissButton />
    </div>

    <MDList>
      <ExampleDocumentCreateListItem
        v-for="definition in starterExampleDefinitions"
        :key="definition.id"
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
    </MDList>
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
    gap: 4px;
  }

  &__heading {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
