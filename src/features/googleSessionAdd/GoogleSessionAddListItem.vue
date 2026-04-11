<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { useGoogleSessionAdd } from './useGoogleSessionAdd';

const { addAccount, isLoading } = useGoogleSessionAdd();
</script>

<template>
  <MDListItem is="button" headline="Add Google Account" @click="addAccount">
    <template #leadingAvatarContainer>
      <MDCircularProgressIndicator v-if="isLoading" :size="24" />

      <MDSymbol v-else name="add" />
    </template>
  </MDListItem>
</template>
