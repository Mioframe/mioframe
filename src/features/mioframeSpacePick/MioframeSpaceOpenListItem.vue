<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { useOpenMioframeSpace } from './useOpenMioframeSpace';

const { loading, openSpace } = useOpenMioframeSpace();
</script>

<template>
  <MDListItem
    is="button"
    headline="Open space"
    supporting-text="Choose a folder that already contains a Mioframe space."
    :lines="2"
    :disabled="loading"
    @click="openSpace"
  >
    <template #leadingIcon>
      <MDSymbol name="folder_open" />
    </template>
  </MDListItem>
</template>
