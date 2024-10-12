import { reactive } from 'vue';
import { COLOR, type Notification } from './types';
import { isString, uniqueId } from 'lodash-es';

export const defineNotifications = () => {
  const notificationMap: Map<Notification, string> = reactive(new Map());

  const useNotifications = () => {
    const pushNotification = (notification: Notification) => {
      const id = uniqueId();
      notificationMap.set(notification, id);

      if (notification.timeout !== Infinity) {
        setTimeout(() => {
          removeNotification(notification);
        }, notification.timeout ?? 5e3);
      }

      return () => {
        removeNotification(notification);
      };
    };

    const removeNotification = (norification: Notification) => {
      notificationMap.delete(norification);
    };

    const pushError = (title: string, e: unknown, timeout = 10e3) => {
      const color = COLOR.danger;
      const header = `Error: ${title}`;
      const message =
        e instanceof Error
          ? e.message
          : isString(e)
            ? e
            : 'an unknown error occurred';

      return pushNotification({
        message,
        color,
        timeout,
        header,
      });
    };

    return {
      pushNotification,
      removeNotification,
      notificationMap,
      pushError,
    };
  };

  return useNotifications;
};
