<script setup lang="ts">
import { useGoogleSessions } from '@entity/googleUserInfo';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ref } from 'vue';

const { login } = useGoogleSessions();
const { addSnackbar } = useSnackbar();

const loading = ref(false);

const onClickAddAccount = async () => {
  if (!loading.value) {
    loading.value = true;
    try {
      await login();
    } catch (error) {
      addSnackbar({
        text: error instanceof Error ? error.message : 'Failed to add Google account',
      });
    } finally {
      loading.value = false;
    }
  }
};
</script>

<template>
  <MDListItem is="button" headline="Add Google Account" @click="onClickAddAccount">
    <template #leadingAvatarContainer>
      <MDCircularProgressIndicator v-if="loading" :size="24" />

      <MDSymbol v-else name="add" />
    </template>
  </MDListItem>
</template>
