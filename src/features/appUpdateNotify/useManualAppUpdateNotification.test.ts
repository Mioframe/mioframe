import { effectScope, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppUpdateSnapshot } from '@shared/serviceClient/appUpdate';

const { addSnackbarMock } = vi.hoisted(() => ({ addSnackbarMock: vi.fn() }));

const snapshot = ref<AppUpdateSnapshot>();
const hasUpdate = ref(false);

vi.mock('@shared/ui/Snackbar', () => ({ useSnackbar: () => ({ addSnackbar: addSnackbarMock }) }));
vi.mock('@entity/appUpdate', () => ({ useAppUpdate: () => ({ snapshot, hasUpdate }) }));

const release = (letter: string, releaseSequence: number) => ({
  releaseId: letter.repeat(40),
  releaseSequence,
  appVersion: '1.0.0',
  buildId: letter.repeat(7),
  buildDate: '2026-07-23T00:00:00.000Z',
});

const activeScopes: ReturnType<typeof effectScope>[] = [];

const mountNotification = async () => {
  const { useManualAppUpdateNotification } = await import('./useManualAppUpdateNotification');
  const scope = effectScope();
  scope.run(() => {
    useManualAppUpdateNotification();
  });
  activeScopes.push(scope);
  return scope;
};

describe('useManualAppUpdateNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    snapshot.value = undefined;
    hasUpdate.value = false;
  });

  afterEach(() => {
    activeScopes.splice(0).forEach((scope) => {
      scope.stop();
    });
  });

  it('notifies on the very first observed release when it is already a genuine Manual update', async () => {
    snapshot.value = {
      capability: 'available',
      mode: 'manual',
      latestRelease: release('b', 2),
      updateState: 'available',
    };
    hasUpdate.value = true;
    await mountNotification();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
  });

  it('does not notify when the first observed release is only the current baseline', async () => {
    snapshot.value = {
      capability: 'available',
      mode: 'manual',
      latestRelease: release('a', 1),
      updateState: 'upToDate',
    };
    hasUpdate.value = false;
    await mountNotification();
    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('notifies once per newly discovered release id and never again for the same one', async () => {
    snapshot.value = {
      capability: 'available',
      mode: 'manual',
      latestRelease: release('a', 1),
      updateState: 'upToDate',
    };
    hasUpdate.value = false;
    const scope = await mountNotification();

    snapshot.value = {
      ...snapshot.value,
      latestRelease: release('b', 2),
      updateState: 'available',
    };
    hasUpdate.value = true;
    await nextTick();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);

    snapshot.value = { ...snapshot.value };
    await nextTick();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
    scope.stop();
  });

  it('does not notify in Automatic mode even when a genuine update is discovered', async () => {
    snapshot.value = {
      capability: 'available',
      mode: 'automatic',
      latestRelease: release('b', 2),
      updateState: 'available',
    };
    hasUpdate.value = true;
    await mountNotification();
    expect(addSnackbarMock).not.toHaveBeenCalled();
  });
});
