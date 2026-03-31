<script setup lang="ts">
import { MDListContainer } from '@shared/ui/Lists';
import GoogleUserInfoListItem from './GoogleUserInfoListItem.vue';
import { useGoogleSessions } from './useGoogleSessions';

const { sessions } = useGoogleSessions();

defineSlots<{
  after: () => unknown;
}>();
</script>

<template>
  <MDListContainer>
    <GoogleUserInfoListItem
      v-for="email in sessions"
      :key="email"
      :email="email"
    />

    <slot name="after" />
  </MDListContainer>
</template>
