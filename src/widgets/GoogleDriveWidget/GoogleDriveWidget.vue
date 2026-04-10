<script setup lang="ts">
import { GoogleSessionListItem, useGoogleSessions } from '@entity/googleSession';
import { GoogleSessionAddListItem } from '@feature/googleSessionAdd';
import { GoogleSessionManageMenuButton } from '@feature/googleSessionManage';
import { MDListContainer } from '@shared/ui/Lists';

const { sessionList } = useGoogleSessions();

const emit = defineEmits<{
  clickUser: [email: string];
}>();
</script>

<template>
  <MDListContainer>
    <GoogleSessionListItem
      v-for="session in sessionList"
      :key="session.email"
      :session="session"
      @click="emit('clickUser', session.email)"
    >
      <template #trailingIcon>
        <GoogleSessionManageMenuButton :email="session.email" />
      </template>
    </GoogleSessionListItem>

    <GoogleSessionAddListItem />
  </MDListContainer>
</template>
