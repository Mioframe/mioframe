<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import { useDocument } from './useDocument';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  supportingText?: string;
  is?: 'button' | 'div' | 'li';
}>();

const { documentId, path } = toRefs(props);

const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

const slots = defineSlots<{
  leadingIcon: () => unknown;
  trailingIcon: (p: { documentName?: string }) => unknown;
  leadingAvatarContainer: () => unknown;
}>();

const { documentDescription } = useDocument(path, documentId);

const documentName = computed(() => documentDescription.value?.name);

const headline = computed(() => documentName.value ?? 'Untitled Document');
</script>

<template>
  <MDListItem
    :is="is"
    :headline="headline"
    :supporting-text="supportingText"
    :aria-label="`document ${headline}`"
    @click="emit('click', $event)"
  >
    <template #leadingIcon>
      <slot name="leadingIcon">
        <MDSymbol name="description" />
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
