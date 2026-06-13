<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs, useSlots } from 'vue';
import { useDocument } from './useDocument';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { MDPlainTooltip } from '@shared/ui/Tooltips';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  supportingText?: string;
  is?: 'button' | 'div' | 'li';
}>();

const emit = defineEmits<{
  click: [documentId: AMDocumentId];
}>();

defineSlots<{
  leading: () => unknown;
  trailingAction: (p: { documentName?: string | undefined }) => unknown;
}>();
const slots = useSlots();

const { documentId, path } = toRefs(props);

const { state: documentDescription, isLoading, errorMessage } = useDocument(path, documentId);

const documentName = computed(() => documentDescription.value?.name);

const headline = computed(() => documentName.value ?? 'Untitled Document');

const onListItemClick = () => {
  emit('click', documentId.value);
};
</script>

<template>
  <MDListItem
    :mode="slots.trailingAction ? 'multi-action' : is === 'button' ? 'single-action' : 'static'"
    :container-tag="is === 'li' ? 'li' : 'div'"
    :label-text="headline"
    :supporting-text="supportingText"
    :aria-label="`document ${headline}`"
    @action="onListItemClick"
  >
    <template #leading>
      <slot name="leading">
        <template v-if="errorMessage">
          <MDPlainTooltip :text="errorMessage" />

          <MDSymbol name="error_med" />
        </template>

        <MDCircularProgressIndicator v-else-if="isLoading" :size="24" />

        <MDSymbol v-else name="description" />
      </slot>
    </template>

    <template v-if="!!slots.trailingAction" #trailingAction>
      <slot name="trailingAction" :document-name="documentName" />
    </template>
  </MDListItem>
</template>
