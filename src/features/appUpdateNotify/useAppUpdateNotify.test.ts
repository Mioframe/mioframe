import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';
import type { AppUpdateStatus } from '@entity/appUpdate';

type Candidate =
  | { phase: 'available' | 'ready' | 'failed'; release: { releaseNumber: number } }
  | { phase: 'activating'; release: { releaseNumber: number } }
  | undefined;

const status = ref<AppUpdateStatus>('not-checked');
const isCapabilityAvailable = ref(true);
const mode = ref<'automatic' | 'manual'>('manual');
const candidate = ref<Candidate>(undefined);

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ status, isCapabilityAvailable, mode, candidate }),
}));

const addSnackbarMock = vi.fn();
vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({ addSnackbar: addSnackbarMock }),
}));

describe('useAppUpdateNotify', () => {
  let activeScope: EffectScope | undefined;

  beforeEach(() => {
    vi.resetModules();
    status.value = 'not-checked';
    isCapabilityAvailable.value = true;
    mode.value = 'manual';
    candidate.value = undefined;
    addSnackbarMock.mockClear();
  });

  afterEach(() => {
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

  const makeManualAvailable = () => {
    status.value = 'update-available';
    mode.value = 'manual';
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
  };

  it('shows one Snackbar for an available candidate in Manual mode with available capability', async () => {
    makeManualAvailable();
    const { onView } = await run();

    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Mioframe update available',
      timeout: 7000,
      actionLabel: 'View',
      callback: onView,
    });
  });

  it('does not notify while unavailable even when a retained snapshot has a Manual available candidate', async () => {
    status.value = 'unavailable';
    isCapabilityAvailable.value = false;
    mode.value = 'manual';
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };

    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('does not notify in Automatic mode', async () => {
    makeManualAvailable();
    mode.value = 'automatic';

    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  const nonNotifyingCandidates: Array<[AppUpdateStatus, Candidate]> = [
    ['ready', { phase: 'ready', release: { releaseNumber: 2 } }],
    ['activating', { phase: 'activating', release: { releaseNumber: 2 } }],
    ['failed', { phase: 'failed', release: { releaseNumber: 2 } }],
  ];

  it.each(nonNotifyingCandidates)(
    'does not notify for a %s candidate',
    async (nextStatus, nextCandidate) => {
      status.value = nextStatus;
      candidate.value = nextCandidate;

      await run();

      expect(addSnackbarMock).not.toHaveBeenCalled();
    },
  );

  it('does not repeat notification for a duplicate refresh of the same release', async () => {
    makeManualAvailable();
    await run();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);

    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
    await nextTick();

    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
  });

  it('allows a strictly newer release to notify in the same session', async () => {
    makeManualAvailable();
    await run();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);

    candidate.value = { phase: 'available', release: { releaseNumber: 3 } };
    await nextTick();

    expect(addSnackbarMock).toHaveBeenCalledTimes(2);
  });

  it('calls the injected onView callback from the Snackbar action', async () => {
    makeManualAvailable();
    const onView = vi.fn();
    await run(onView);

    const call = addSnackbarMock.mock.calls[0];
    if (!call) throw new Error('Expected addSnackbar to have been called');
    call[0].callback();

    expect(onView).toHaveBeenCalledTimes(1);
  });
});
