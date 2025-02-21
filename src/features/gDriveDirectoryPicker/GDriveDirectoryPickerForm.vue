<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import type { GDriveDirectory, GDriveFile } from '../../shared/lib/googleDrive';
import { GDriveDirectoryList } from '../../entities/gDrive';
import { createGDriveSpaces } from '../../shared/lib/googleDrive/createGDriveSpaces';
import GUserCard from '../../entities/gProfile/GProfileCard.vue';
import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import { GDriveScope } from '@shared/lib/googleApi/types';
import { createPreviouslyCreatedFolders } from './previouslyCreatedFolders';
import { sum, values } from 'lodash-es';
import FormLayout from '@shared/ui/FormLayout.vue';
import type { Collection } from '@shared/ui/TreeMenu/useIterable';
import { MDButton } from '@shared/ui/Button';

const emit = defineEmits<{
  submit: [directory: GDriveDirectory];
  cancel: [];
}>();

const selectedGDriveDirectory = shallowRef<GDriveDirectory | GDriveFile>();

const onSubmit = () => {
  if (
    selectedGDriveDirectory.value &&
    'writeFile' in selectedGDriveDirectory.value
  ) {
    emit('submit', selectedGDriveDirectory.value);
  }
};

const onClickCancel = () => {
  emit('cancel');
};

const rootGDriveDirectory =
  shallowRef<Collection<[string, GDriveDirectory | GDriveFile]>>();

const previouslyCreatedFolders =
  shallowRef<Collection<[string, GDriveDirectory | GDriveFile]>>();

const googleApi = useGoogleApi();

const fetchRootDirectory = async () => {
  const gDrive = await googleApi.getGDrive([GDriveScope.all]);

  if (gDrive) {
    rootGDriveDirectory.value = createGDriveSpaces(gDrive).children;
    previouslyCreatedFolders.value =
      createPreviouslyCreatedFolders(gDrive).children;
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

const onClickList = (_key: unknown, item: GDriveDirectory | GDriveFile) => {
  if ('children' in item && item.getName() !== 'root') {
    selectedGDriveDirectory.value = item;
  }
};

const filterFolders = ([, item]: [unknown, GDriveDirectory | GDriveFile]) =>
  'children' in item;

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
      <MDButton
        v-if="!userInfo"
        type="filled"
        class="is-fullwidth"
        :class="{
          'is-loading': googleLoading,
        }"
        label="use google"
        @click="onClickLogin"
      >
        <template #icon>
          <i class="fa-brands fa-google" />
        </template>
      </MDButton>

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
        :collection="previouslyCreatedFolders"
        :active-item="selectedGDriveDirectory"
        :filter="filterFolders"
        @click="onClickList"
      />
    </div>

    <div v-if="rootGDriveDirectory" class="field">
      <span class="label">Google Drive</span>

      <GDriveDirectoryList
        :collection="rootGDriveDirectory"
        :active-item="selectedGDriveDirectory"
        :filter="filterFolders"
        @click="onClickList"
      />
    </div>

    <template #actions>
      <MDButton
        form-action="submit"
        :disabled="!selectedGDriveDirectory"
        label="Apply"
        type="tonal"
      />

      <MDButton label="Cancel" form-action="reset" @click="onClickCancel" />
    </template>
  </FormLayout>
</template>
