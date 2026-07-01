<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { useOpenMioframeSpace } from './useOpenMioframeSpace';

const { loading, openSpace } = useOpenMioframeSpace();
</script>

<template>
  <MDListItem
    mode="single-action"
    label-text="Open space"
    supporting-text="Open an existing space folder"
    :disabled="loading"
    @action="openSpace"
  >
    <template #leading>
      <MDSymbol name="folder_open" />
    </template>
  </MDListItem>
</template>
