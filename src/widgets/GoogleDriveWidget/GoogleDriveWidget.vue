<script setup lang="ts">
import {
  GoogleUserInfoListItem,
  useGoogleSessions,
} from '@entity/googleUserInfo';
import { GoogleSessionAddListItem } from '@feature/googleSessionAdd';
import { MDListContainer } from '@shared/ui/Lists';

const { sessions } = useGoogleSessions();

const emit = defineEmits<{
  clickUser: [email: string];
}>();
</script>

<template>
  <MDListContainer>
    <GoogleUserInfoListItem
      v-for="email in sessions"
      :key="email"
      :email="email"
      @click="emit('clickUser', email)"
    />

    <GoogleSessionAddListItem />
  </MDListContainer>
</template>
