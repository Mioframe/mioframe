<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import { MDIconButton } from '@shared/ui/Button';
import MDSymbol from '@shared/ui/Icon/MDSymbol.vue';
import { MDTopAppBar } from '@shared/ui/TopAppBar';
import { toRef } from 'vue';

/**
 * Виджет просмотра документа
 */

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const emit = defineEmits<{
  clickBack: [];
}>();

const { content, name } = useCFRDocument(toRef(() => docHandle));

const onClickBack = () => {
  emit('clickBack');
};
</script>

<template>
  <div class="document-view-widget">
    <MDTopAppBar :headline="name">
      <template #leadingNavigation>
        <MDIconButton tooltip="back" @click="onClickBack">
          <template #icon>
            <MDSymbol name="arrow_back" />
          </template>
        </MDIconButton>
      </template>
    </MDTopAppBar>

    <pre>{{ content }}</pre>
  </div>
</template>

<style lang="css" scoped>
.document-view-widget {
  position: relative;
  flex: 1 1;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  --md-container-color: var(--md-sys-color-surface);
  overflow-y: auto;
}
</style>
