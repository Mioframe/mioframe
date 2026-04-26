<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
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
  click: [e: MouseEvent];
}>();

const slots = defineSlots<{
  leadingIcon: () => unknown;
  trailingIcon: (p: { documentName?: string | undefined }) => unknown;
  leadingAvatarContainer: () => unknown;
}>();

const { documentId, path } = toRefs(props);

const { state: documentDescription, isLoading, errorMessage } = useDocument(path, documentId);

const documentName = computed(() => documentDescription.value?.name);

const headline = computed(() => documentName.value ?? 'Untitled Document');

const onListItemClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <MDListItem
    :is="is"
    :headline="headline"
    :supporting-text="supportingText"
    :aria-label="`document ${headline}`"
    @click="onListItemClick"
  >
    <template #leadingIcon>
      <slot name="leadingIcon">
        <template v-if="errorMessage">
          <MDPlainTooltip :text="errorMessage" />

          <MDSymbol name="error_med" />
        </template>

        <MDCircularProgressIndicator v-else-if="isLoading" :size="24" />

        <MDSymbol v-else name="description" />
      </slot>
    </template>

    <template v-if="!!slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" :document-name="documentName" />
    </template>

    <template v-if="!!slots.leadingAvatarContainer" #leadingAvatarContainer>
      <slot name="leadingAvatarContainer" />
    </template>
  </MDListItem>
</template>
