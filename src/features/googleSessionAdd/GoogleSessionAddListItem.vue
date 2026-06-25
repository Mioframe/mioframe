<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { useGoogleSessionAdd } from './useGoogleSessionAdd';

const { addAccount, isLoading } = useGoogleSessionAdd();
</script>

<template>
  <MDListItem
    mode="single-action"
    label-text="Add Google Account"
    supporting-text="Connect a Google Drive account to browse and mount its storage"
    @action="addAccount"
  >
    <template #leading>
      <MDCircularProgressIndicator v-if="isLoading" :size="24" />

      <MDSymbol v-else name="add" />
    </template>
  </MDListItem>
</template>
