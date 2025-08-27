<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRef } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  supportingText?: string;
  isButton?: boolean;
}>();

const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

const slots = defineSlots<{
  leadingIcon: () => unknown;
  trailingIcon: (p: { documentName?: string }) => unknown;
  leadingAvatarContainer: () => unknown;
}>();

const docHandle = toRef(() => props.docHandle);

const cfrDocument = useCFRDocument(docHandle);

const documentName = computed(() => cfrDocument.content?.name);

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
