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
  trailingIcon: () => unknown;
  leadingAvatarContainer: () => unknown;
}>();

const docHandle = toRef(() => props.docHandle);

const cfrDocument = useCFRDocument(docHandle);

const headline = computed(
  () => cfrDocument.content?.name ?? 'Untitled Document',
);
</script>

<template>
  <MDListItem
    :headline
    :supporting-text
    :is="isButton ? 'button' : undefined"
    @click="emit('click', $event)"
  >
    <template #leadingIcon>
      <slot name="leadingIcon">
        <MDSymbol name="description" />
      </slot>
    </template>

    <template v-if="!!slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" />
    </template>

    <template v-if="!!slots.leadingAvatarContainer" #leadingAvatarContainer>
      <slot name="leadingAvatarContainer" />
    </template>
  </MDListItem>
</template>
