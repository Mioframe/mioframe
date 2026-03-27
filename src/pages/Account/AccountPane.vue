<script setup lang="ts">
import { GoogleUserInfoCard, useGoogleSessions } from '@entity/googleUserInfo';
import { MDPane } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
}>();

const { sessions } = useGoogleSessions();
</script>

<template>
  <MDPane class="account">
    <GoogleUserInfoCard v-for="email in sessions" :key="email" :email="email" />
    <!-- // TODO: сделать управляемый список аккаунтов google -->
  </MDPane>
</template>
