import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

const mode = ref<'automatic' | 'manual'>('manual');
const activeRelease = ref<{ releaseId: string; releaseSequence: number } | undefined>({
  releaseId: 'release-a',
  releaseSequence: 1,
});
const latestRelease = ref<{ releaseId: string; releaseSequence: number } | undefined>(undefined);
const scheduledRelease = ref<{ releaseId: string; releaseSequence: number } | undefined>(undefined);

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ mode, activeRelease, latestRelease, scheduledRelease }),
}));

const addSnackbarMock = vi.fn();
vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({ addSnackbar: addSnackbarMock }),
}));

describe('useAppUpdateNotify', () => {
  let activeScope: EffectScope | undefined;

  beforeEach(() => {
    vi.resetModules();
    mode.value = 'manual';
    activeRelease.value = { releaseId: 'release-a', releaseSequence: 1 };
    latestRelease.value = undefined;
    scheduledRelease.value = undefined;
    addSnackbarMock.mockClear();
  });

  afterEach(() => {
    // Each test's watcher observes the shared module-level refs above; leaving
    // it running would make it react to a later test's ref mutations too.
    activeScope?.stop();
    activeScope = undefined;
  });

  const run = async (onView: () => void = vi.fn()) => {
    const { useAppUpdateNotify } = await import('./useAppUpdateNotify');
    const scope = effectScope();
    activeScope = scope;
    scope.run(() => {
      useAppUpdateNotify(onView);
    });
    await nextTick();
    return { onView, scope };
  };

  it('shows one Snackbar when Manual mode discovers a newer, unscheduled release', async () => {
    latestRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    const { onView } = await run();

    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Mioframe update available',
      timeout: 7000,
      actionLabel: 'View',
      callback: onView,
    });
  });

  it('shows nothing in Automatic mode', async () => {
    mode.value = 'automatic';
    latestRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows nothing when up to date (latest equals active)', async () => {
    latestRelease.value = { releaseId: 'release-a', releaseSequence: 1 };
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows nothing once the release is already scheduled', async () => {
    latestRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    scheduledRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('does not repeat for a duplicate snapshot read of the same release id', async () => {
    latestRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    await run();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);

    // A duplicate refresh reassigns the same value (new object, same id) —
    // as a real invalidation-triggered GET_SNAPSHOT refresh would.
    latestRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    await nextTick();

    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
  });

  it('may notify again for a strictly newer release id within the same session', async () => {
    latestRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    await run();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);

    latestRelease.value = { releaseId: 'release-c', releaseSequence: 3 };
    await nextTick();

    expect(addSnackbarMock).toHaveBeenCalledTimes(2);
  });

  it('calls onView (owned by the caller) from the Snackbar action', async () => {
    latestRelease.value = { releaseId: 'release-b', releaseSequence: 2 };
    const onView = vi.fn();
    await run(onView);

    const call = addSnackbarMock.mock.calls[0];
    if (!call) throw new Error('Expected addSnackbar to have been called');
    call[0].callback();

    expect(onView).toHaveBeenCalledTimes(1);
  });
});
