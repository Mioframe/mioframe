<script setup lang="ts">
import { GProfileCard } from '@entity/gProfile';
import { MDPane } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
}>();
</script>

<template>
  <MDPane class="account">
    <GProfileCard />
  </MDPane>
</template>
