<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import type {
  GDriveDirectory,
  GDriveFile,
  GDriveSpaces,
} from '../../shared/lib/googleDrive';
import { GDriveDirectoryList } from '../../entities/gDrive';
import { createGDriveSpaces } from '../../shared/lib/googleDrive/createGDriveSpaces';
import GUserCard from '../../entities/gProfile/GProfileCard.vue';
import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import { GDriveScope } from '@shared/lib/googleApi/types';
import { createPreviouslyCreatedFolders } from './previouslyCreatedFolders';
import { sum, values } from 'lodash-es';
import FormLayout from '@shared/ui/FormLayout.vue';

const emit = defineEmits<{
  submit: [directory: GDriveDirectory];
  cancel: [];
}>();

const selectedGDriveDirectory = shallowRef<GDriveDirectory>();

const onSubmit = () => {
  if (selectedGDriveDirectory.value) {
    emit('submit', selectedGDriveDirectory.value);
  }
};

const onClickCancel = () => {
  emit('cancel');
};

const rootGDriveDirectory = shallowRef<GDriveDirectory | GDriveSpaces>();

const previouslyCreatedFolders = shallowRef<{
  get: () => Promise<Map<string, GDriveDirectory>>;
}>();

const googleApi = useGoogleApi();

const fetchRootDirectory = async () => {
  const gDrive = await googleApi.getGDrive([GDriveScope.all]);

  if (gDrive) {
    rootGDriveDirectory.value = createGDriveSpaces(gDrive);
    previouslyCreatedFolders.value = createPreviouslyCreatedFolders(gDrive);
  }
};

const userInfo = computed(() => googleApi.userInfo);

watch(
  userInfo,
  (userInfo) => {
    if (userInfo) {
      void fetchRootDirectory();
    } else {
      rootGDriveDirectory.value = undefined;
    }
  },
  { immediate: true },
);

const onClickList = (_key: string, item: GDriveDirectory | GDriveFile) => {
  if ('get' in item && item.getName() !== 'root') {
    selectedGDriveDirectory.value = item;
  }
};

const filterFolders = ([, item]: [string, GDriveDirectory | GDriveFile]) =>
  'get' in item;

const googleLoading = computed(() => sum(values(googleApi.loading)));

const onClickLogin = async () => {
  await googleApi.requestAccessToken([GDriveScope.all]);
};

const onClickLogout = () => {
  rootGDriveDirectory.value = undefined;
  previouslyCreatedFolders.value = undefined;
  googleApi.removeToken();
};

// todo: добавить фичу создания директории
</script>

<template>
  <FormLayout @submit="onSubmit">
    <div class="field">
      <button
        v-if="!userInfo"
        type="button"
        class="button is-fullwidth"
        :class="{
          'is-loading': googleLoading,
        }"
        @click="onClickLogin"
      >
        <span class="icon">
          <i class="fa-brands fa-google" />
        </span>

        <span> use google </span>
      </button>

      <GUserCard
        v-else
        :email="userInfo.email"
        :name="userInfo.name"
        :picture="userInfo.picture"
      >
        <template #mediaRight>
          <button type="button" class="button" @click="onClickLogout">
            logout
          </button>
        </template>
      </GUserCard>
    </div>

    <div v-if="previouslyCreatedFolders" class="field">
      <span class="label">folders with documents</span>

      <GDriveDirectoryList
        :g-drive-directory="previouslyCreatedFolders"
        :active-item="selectedGDriveDirectory"
        :filter="filterFolders"
        @click="onClickList"
      />
    </div>

    <div v-if="rootGDriveDirectory" class="field">
      <span class="label">Google Drive</span>

      <GDriveDirectoryList
        :g-drive-directory="rootGDriveDirectory"
        :active-item="selectedGDriveDirectory"
        :filter="filterFolders"
        @click="onClickList"
      />
    </div>

    <template #actions>
      <button
        class="button is-primary"
        type="submit"
        :disabled="!selectedGDriveDirectory"
      >
        Apply
      </button>

      <button class="button" type="reset" @click="onClickCancel">Cancel</button>
    </template>
  </FormLayout>
</template>
