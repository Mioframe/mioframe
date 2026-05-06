import { useVfsActivity } from '@entity/vfsActivity';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { computed, watch, type ComputedRef } from 'vue';

interface BeforeUnloadTarget {
  addEventListener(type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void): void;
  removeEventListener(type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void): void;
}

/**
 * Returns whether active VFS mutations should block page unload.
 * @param state - Current VFS activity state.
 * @returns `true` when one or more write mutations are still in flight.
 */
export const shouldPreventUnloadDuringActiveWrites = (state: VfsActivityState): boolean =>
  state.activeCount > 0;

/**
 * Attaches a `beforeunload` listener only while the provided block flag is active.
 * @param isBlocked - Reactive flag that controls whether page unload should be prevented.
 * @param target - Event target used to register the browser `beforeunload` listener.
 */
export const useBeforeUnloadGuard = (
  isBlocked: ComputedRef<boolean>,
  target: BeforeUnloadTarget,
): void => {
  const onBeforeUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Browser unload prompts still rely on returnValue.
    event.returnValue = '';
  };

  watch(
    isBlocked,
    (blocked, _previous, onCleanup) => {
      if (!blocked) {
        return;
      }

      target.addEventListener('beforeunload', onBeforeUnload);

      onCleanup(() => {
        target.removeEventListener('beforeunload', onBeforeUnload);
      });
    },
    { immediate: true },
  );
};

/**
 * Prevents closing or reloading the page while VFS write mutations are still active.
 */
export const usePreventUnloadDuringActiveWrites = (): void => {
  const { state } = useVfsActivity();
  const isBlocked = computed(() => shouldPreventUnloadDuringActiveWrites(state.value));

  if (typeof window !== 'undefined') {
    useBeforeUnloadGuard(isBlocked, window);
  }
};
