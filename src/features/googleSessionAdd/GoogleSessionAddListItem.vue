<script setup lang="ts">
import { useGoogleSessions } from '@entity/googleUserInfo';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { ref } from 'vue';

const { login } = useGoogleSessions();

const loading = ref(false);

const onClickAddAccount = async () => {
  if (!loading.value) {
    loading.value = true;
    try {
      await login();
    } finally {
      loading.value = false;
    }
  }
};
</script>

<template>
  <MDListItem
    is="button"
    headline="Add Google Account"
    @click="onClickAddAccount"
  >
    <template #leadingAvatarContainer>
      <MDCircularProgressIndicator v-if="loading" :size="24" />

      <MDSymbol v-else name="add" />
    </template>
  </MDListItem>
</template>
