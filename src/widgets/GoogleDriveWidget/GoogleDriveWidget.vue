<script setup lang="ts">
import { GoogleSessionListItem, useGoogleSessions } from '@entity/googleSession';
import { GoogleSessionAddListItem } from '@feature/googleSessionAdd';
import { GoogleSessionManageMenuButton } from '@feature/googleSessionManage';
import { MDListContainer } from '@shared/ui/Lists';

const emit = defineEmits<{
  clickUser: [email: string];
}>();

const { sessionList } = useGoogleSessions();
</script>

<template>
  <MDListContainer>
    <GoogleSessionListItem
      v-for="session in sessionList"
      :key="session.email"
      :session="session"
      @click="() => emit('clickUser', session.email)"
    >
      <template #trailingAction>
        <GoogleSessionManageMenuButton :email="session.email" />
      </template>
    </GoogleSessionListItem>

    <GoogleSessionAddListItem />
  </MDListContainer>
</template>
