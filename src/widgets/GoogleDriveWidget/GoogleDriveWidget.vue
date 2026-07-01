<script setup lang="ts">
import { GoogleSessionListItem, useGoogleSessions } from '@entity/googleSession';
import { GoogleSessionAddListItem } from '@feature/googleSessionAdd';
import { GoogleSessionManageMenuButton } from '@feature/googleSessionManage';
import { MDList } from '@shared/ui/Lists';
import { MDCard } from '@shared/ui/Card';

const emit = defineEmits<{
  clickUser: [email: string];
}>();

const { sessionList } = useGoogleSessions();
</script>

<template>
  <MDCard
    class="google-drive-widget"
    variant="outlined"
    role="region"
    aria-labelledby="google-drive-widget-heading"
  >
    <h2
      id="google-drive-widget-heading"
      class="google-drive-widget__heading md-typescale-title-small"
    >
      Google Drive
    </h2>

    <MDList>
      <GoogleSessionListItem
        v-for="session in sessionList"
        :key="session.email"
        :session="session"
        @click="emit('clickUser', session.email)"
      >
        <template #trailingAction>
          <GoogleSessionManageMenuButton :email="session.email" />
        </template>
      </GoogleSessionListItem>

      <GoogleSessionAddListItem />
    </MDList>
  </MDCard>
</template>

<style scoped>
.google-drive-widget {
  &__heading {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
