<script setup lang="ts">
import {
  GoogleUserInfoListItem,
  useGoogleSessions,
} from '@entity/googleUserInfo';
import { GoogleSessionAddListItem } from '@feature/googleSessionAdd';
import { useStackNavigation } from '@page/routes';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { GOOGLE_DRIVE_ROOT_NAME } from '@shared/service/google/useGoogleService';
import { MDListContainer } from '@shared/ui/Lists';

const { sessions } = useGoogleSessions();

// FIXME: убрать роутинг из виджета в слой страницы
const { open } = useStackNavigation();

const onClickUser = async (email: string) => {
  await open(
    'repo',
    {
      repoPath: PathUtils.join(GOOGLE_DRIVE_ROOT_NAME, email),
    },
    { target: 'repo' },
  );
};
</script>

<template>
  <MDListContainer>
    <GoogleUserInfoListItem
      v-for="email in sessions"
      :key="email"
      :email="email"
      @click="onClickUser(email)"
    />

    <GoogleSessionAddListItem />
  </MDListContainer>
</template>
