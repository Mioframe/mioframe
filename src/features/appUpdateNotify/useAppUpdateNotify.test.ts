import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

type Candidate =
  | { phase: 'available' | 'ready' | 'failed'; release: { releaseNumber: number } }
  | { phase: 'activating'; release: { releaseNumber: number }; deadlineAt: string }
  | undefined;

const mode = ref<'automatic' | 'manual'>('manual');
const candidate = ref<Candidate>(undefined);

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ mode, candidate }),
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
    candidate.value = undefined;
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

  it('shows one Snackbar for an available candidate in Manual mode', async () => {
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
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
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows nothing when there is no candidate', async () => {
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows nothing for a ready candidate', async () => {
    candidate.value = { phase: 'ready', release: { releaseNumber: 2 } };
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows nothing for an activating candidate', async () => {
    candidate.value = {
      phase: 'activating',
      release: { releaseNumber: 2 },
      deadlineAt: '2026-07-24T00:00:30.000Z',
    };
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows nothing for a failed candidate', async () => {
    candidate.value = { phase: 'failed', release: { releaseNumber: 2 } };
    await run();

    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('does not repeat for a duplicate snapshot read of the same release number', async () => {
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
    await run();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);

    // A duplicate refresh reassigns the same value (new object, same
    // number) — as a real invalidation-triggered GET_SNAPSHOT refresh would.
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
    await nextTick();

    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
  });

  it('may notify again for a strictly newer release number within the same session', async () => {
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
    await run();
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);

    candidate.value = { phase: 'available', release: { releaseNumber: 3 } };
    await nextTick();

    expect(addSnackbarMock).toHaveBeenCalledTimes(2);
  });

  it('calls onView (owned by the caller) from the Snackbar action', async () => {
    candidate.value = { phase: 'available', release: { releaseNumber: 2 } };
    const onView = vi.fn();
    await run(onView);

    const call = addSnackbarMock.mock.calls[0];
    if (!call) throw new Error('Expected addSnackbar to have been called');
    call[0].callback();

    expect(onView).toHaveBeenCalledTimes(1);
  });
});
