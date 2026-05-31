<script setup lang="ts">
import { computed } from 'vue';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { MDSymbol } from '@shared/ui/Icon';

const { message, spaceName } = defineProps<{
  message?: string | undefined;
  spaceName: string;
}>();

defineSlots<{
  actions: () => unknown;
}>();

const supportingText = computed(
  () =>
    message ??
    `Mioframe remembers "${spaceName}", but your browser requires permission before opening it.`,
);
</script>

<template>
  <div class="device-directory-access-recovery-state">
    <MDEmptyState
      class="device-directory-access-recovery-state__content"
      headline="Permission required"
      :supporting-text="supportingText"
    >
      <template #icon>
        <MDSymbol name="folder_managed" class="device-directory-access-recovery-state__icon" />
      </template>

      <template #actions>
        <slot name="actions" />
      </template>
    </MDEmptyState>
  </div>
</template>

<style scoped>
.device-directory-access-recovery-state {
  &__icon {
    --md-content-color: var(--md-sys-color-primary);
  }
}
</style>
