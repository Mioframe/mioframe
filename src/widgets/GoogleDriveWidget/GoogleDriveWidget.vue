<script setup lang="ts">
import { GoogleSessionListItem, useGoogleSessions } from '@entity/googleSession';
import { GoogleSessionAddListItem } from '@feature/googleSessionAdd';
import { GoogleSessionManageMenuButton } from '@feature/googleSessionManage';
import { MDList } from '@shared/ui/Lists';

const emit = defineEmits<{
  clickUser: [email: string];
}>();

const { sessionList } = useGoogleSessions();
</script>

<template>
  <div class="google-drive-widget">
    <MDList>
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
    </MDList>
  </div>
</template>

<style scoped>
.google-drive-widget {
  --md-container-color: var(
    --md-sys-color-surface-container-low,
    var(--md-sys-color-surface-container)
  );
  --md-content-color: var(--md-sys-color-on-surface);
  background: var(--md-current-container-color, var(--md-container-color));
  border-radius: 16dp;
  color: var(--md-current-content-color, var(--md-content-color));
}
</style>
