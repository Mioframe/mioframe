<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
</script>

<template>
  <MDListItem is="button" headline="Add Account">
    <template #leadingIcon>
      <MDSymbol name="add" />
    </template>
  </MDListItem>
</template>
