<script setup lang="ts">
import { useVfsActivity } from '@entity/vfsActivity';
import { MDAssistChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { computed, shallowRef } from 'vue';

const storageStateItem = {
  key: 'storage-state',
  label: 'Состояние хранения',
  symbolName: 'info',
} as const;

const { state } = useVfsActivity();
const showStorageStateSheet = shallowRef(false);

const statusLabel = computed(() => {
  switch (state.value.status) {
    case 'active':
      return 'Сохраняем';
    case 'error':
      return 'Ошибка';
    default:
      return undefined;
  }
});

const statusIcon = computed(() => (state.value.status === 'error' ? 'error' : 'sync'));

const menuItems = defineMenuButtonList([storageStateItem]);

const onClickMenuAction = () => {
  showStorageStateSheet.value = true;
};

const onCloseStorageState = () => {
  showStorageStateSheet.value = false;
};

const storageStateDescription = computed(() => {
  switch (state.value.status) {
    case 'active':
      return 'Изменения сохраняются. Закрывать экран сейчас не стоит.';
    case 'error':
      return 'Не удалось подтвердить последнее сохранение. Проверьте состояние папки и повторите действие.';
    default:
      return 'Все последние изменения сохранены.';
  }
});
</script>

<template>
  <MDAssistChip v-if="statusLabel" :label="statusLabel" @click="onClickMenuAction">
    <template #leadingIcon>
      <MDSymbol :name="statusIcon" />
    </template>
  </MDAssistChip>

  <MDContextMenuButton :btns="menuItems" tooltip="Меню экрана" @click="onClickMenuAction" />

  <MDBottomSheet
    v-if="showStorageStateSheet"
    label="Состояние хранения"
    @closed="onCloseStorageState"
  >
    <MDBottomSheetSection class="repo-explorer-screen-menu__sheet">
      <h2 class="repo-explorer-screen-menu__title">Состояние хранения</h2>
      <p class="repo-explorer-screen-menu__text">{{ storageStateDescription }}</p>
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>

<style scoped>
.repo-explorer-screen-menu__sheet {
  padding: 0 16px 24px;
  gap: 12px;
}

.repo-explorer-screen-menu__title {
  margin: 0;
  font-family: var(--md-sys-typescale-headline-small-font);
  font-size: var(--md-sys-typescale-headline-small-size);
  font-weight: var(--md-sys-typescale-headline-small-weight);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  letter-spacing: var(--md-sys-typescale-headline-small-tracking);
}

.repo-explorer-screen-menu__text {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
