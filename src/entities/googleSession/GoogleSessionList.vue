<script setup lang="ts">
import { MDListContainer } from '@shared/ui/Lists';
import GoogleSessionListItem from './GoogleSessionListItem.vue';
import { useGoogleSessions } from './useGoogleSessions';

defineSlots<{
  after: () => unknown;
}>();

const { sessionList } = useGoogleSessions();
</script>

<template>
  <MDListContainer is="div">
    <GoogleSessionListItem v-for="session in sessionList" :key="session.email" :session="session" />

    <slot name="after" />
  </MDListContainer>
</template>
