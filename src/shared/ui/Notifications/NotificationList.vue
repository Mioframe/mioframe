<script setup lang="ts">
import { useNotifications } from './mainNotifications';
import type { Notification } from './types';
import { COLOR } from './types';
import '@noction/vue-bezier/styles';
import { SlideYUpTransition } from '@noction/vue-bezier';
import { isUndefined } from 'lodash-es';

const { notificationMap: notificationSet, removeNotification } =
  useNotifications();

const onClickDelete = (notification: Notification) => {
  removeNotification(notification);
};

const getColorClass = (color?: COLOR) => {
  return isUndefined(color) ? undefined : `is-${COLOR[color]}`;
};

// todo: добавить web уведомления если страница в фоне и есть доступ
</script>

<template>
  <SlideYUpTransition group class="notification-list">
    <template v-for="[notification, id] in notificationSet" :key="id">
      <aside
        v-if="notification.header?.length"
        class="notification-list__item message"
        :class="[getColorClass(notification.color)]"
      >
        <div class="message-header">
          <p>{{ notification.header }}</p>

          <button
            type="button"
            class="delete"
            @click="onClickDelete(notification)"
          />
        </div>

        <div class="message-body">
          {{ notification.message }}
        </div>
      </aside>

      <div
        v-else
        class="notification-list__item notification"
        :class="[getColorClass(notification.color)]"
      >
        <button
          type="button"
          class="delete"
          @click="onClickDelete(notification)"
        />
        {{ notification.message }}
      </div>
    </template>
  </SlideYUpTransition>
</template>

<style lang="scss" scoped>
.notification-list {
  position: fixed;
  pointer-events: none;
  top: 0;
  right: 0;
  max-height: 100dvh;
  left: 0;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 16px;
  padding: 16px;

  display: flex;
  flex-direction: column;
  flex-wrap: wrap-reverse;
  align-content: flex-start;

  &__item {
    pointer-events: all;
    display: inline-block;
    width: 343px;
  }
}
</style>
