<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import { useCFRDocumentClient } from './client';

const props = defineProps<{
  path: EntryPath | EntryPathString;
  documentId: AMDocumentId;
  supportingText?: string;
  isButton?: boolean;
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

const {
  documentDescription: { get: getDocumentDescription },
} = useCFRDocumentClient();

const documentDescription = computed(() =>
  getDocumentDescription(path.value, documentId.value),
);

const documentName = computed(() => documentDescription.value?.name);

const headline = computed(() => documentName.value ?? 'Untitled Document');
</script>

<template>
  <MDListItem
    :is="isButton ? 'button' : undefined"
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
