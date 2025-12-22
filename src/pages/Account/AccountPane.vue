<script setup lang="ts">
import { GProfileCard } from '@entity/gProfile';
import { MDPaneContainer } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
}>();
</script>

<template>
  <MDPaneContainer class="account">
    <GProfileCard />
  </MDPaneContainer>
</template>
