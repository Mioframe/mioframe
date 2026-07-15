import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import { generateViewId, type DatabaseViewId } from '@shared/lib/databaseDocument';
import type { ReorderCommitResult } from '@shared/lib/reorder';
import { useDatabaseViewReorderState } from './useDatabaseViewReorderState';

const { addSnackbarMock, captureDiagnosticExceptionMock } = vi.hoisted(() => ({
  addSnackbarMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
}));

const idA = generateViewId();
const idB = generateViewId();
const idC = generateViewId();

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useDatabaseViewReorderState', () => {
  beforeEach(() => {
    addSnackbarMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
  });

  it('follows canonical ids while idle', () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const { displayIds, isPending } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      vi.fn(),
    );

    expect(displayIds.value).toEqual([idA, idB, idC]);
    expect(isPending.value).toBe(false);

    canonicalIds.value = [idB, idA, idC];
    expect(displayIds.value).toEqual([idB, idA, idC]);
  });

  it('applies the optimistic order immediately and sets pending before persistence resolves', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const { promise, resolve } = deferred<ReorderCommitResult>();
    const reorder = vi.fn().mockReturnValue(promise);
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    const call = onReorder({
      expectedOrderedIds: [idA, idB, idC],
      orderedIds: [idB, idA, idC],
    });

    expect(displayIds.value).toEqual([idB, idA, idC]);
    expect(isPending.value).toBe(true);
    expect(reorder).toHaveBeenCalledTimes(1);

    resolve('applied');
    await call;
  });

  it('holds the optimistic order on applied until canonical confirms the same order', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const reorder = vi.fn().mockResolvedValue('applied' satisfies ReorderCommitResult);
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    await onReorder({ expectedOrderedIds: [idA, idB, idC], orderedIds: [idB, idA, idC] });

    expect(isPending.value).toBe(true);
    expect(displayIds.value).toEqual([idB, idA, idC]);

    canonicalIds.value = [idB, idA, idC];
    await nextTick();

    expect(isPending.value).toBe(false);
    expect(displayIds.value).toEqual([idB, idA, idC]);
  });

  it('rolls back to canonical on stale', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const reorder = vi.fn().mockResolvedValue('stale' satisfies ReorderCommitResult);
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    await onReorder({ expectedOrderedIds: [idA, idB, idC], orderedIds: [idB, idA, idC] });

    expect(isPending.value).toBe(false);
    expect(displayIds.value).toEqual([idA, idB, idC]);
  });

  it('rolls back to canonical and reports diagnostics on rejection', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const reorder = vi.fn().mockRejectedValue(new Error('network down'));
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    await onReorder({ expectedOrderedIds: [idA, idB, idC], orderedIds: [idB, idA, idC] });

    expect(isPending.value).toBe(false);
    expect(displayIds.value).toEqual([idA, idB, idC]);
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('ignores a second reorder request while one is pending', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const { promise } = deferred<ReorderCommitResult>();
    const reorder = vi.fn().mockReturnValue(promise);
    const { onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    void onReorder({ expectedOrderedIds: [idA, idB, idC], orderedIds: [idB, idA, idC] });
    await onReorder({ expectedOrderedIds: [idB, idA, idC], orderedIds: [idC, idB, idA] });

    expect(reorder).toHaveBeenCalledTimes(1);
  });

  it('shows the new canonical order on a conflicting canonical update, blocks a second drag, and clears only once the service settles', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const { promise, resolve } = deferred<ReorderCommitResult>();
    const reorder = vi.fn().mockReturnValue(promise);
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    const call = onReorder({ expectedOrderedIds: [idA, idB, idC], orderedIds: [idB, idA, idC] });

    // Neither the expected start order nor the requested order: a conflicting external change.
    canonicalIds.value = [idC, idA, idB];
    await nextTick();

    expect(displayIds.value).toEqual([idC, idA, idB]);
    expect(isPending.value).toBe(true);

    // A second drag must stay blocked while the conflicted request is still outstanding.
    await onReorder({ expectedOrderedIds: [idC, idA, idB], orderedIds: [idA, idC, idB] });
    expect(reorder).toHaveBeenCalledTimes(1);
    expect(isPending.value).toBe(true);

    resolve('applied');
    await call;

    expect(isPending.value).toBe(false);
    expect(displayIds.value).toEqual([idC, idA, idB]);
  });

  it('keeps pending when canonical confirms first while the service call is still outstanding, blocks a second drag, and clears once the service applies', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const { promise, resolve } = deferred<ReorderCommitResult>();
    const reorder = vi.fn().mockReturnValue(promise);
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    const call = onReorder({ expectedOrderedIds: [idA, idB, idC], orderedIds: [idB, idA, idC] });

    canonicalIds.value = [idB, idA, idC];
    await nextTick();

    // Canonical confirmed the requested order, but the service promise has not settled yet.
    expect(isPending.value).toBe(true);
    expect(displayIds.value).toEqual([idB, idA, idC]);

    await onReorder({ expectedOrderedIds: [idB, idA, idC], orderedIds: [idC, idB, idA] });
    expect(reorder).toHaveBeenCalledTimes(1);

    resolve('applied');
    await call;

    expect(isPending.value).toBe(false);
    expect(displayIds.value).toEqual([idB, idA, idC]);
  });

  it('reports the rejection and clears pending even when canonical confirmed the request before the service rejected', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const { promise, reject } = deferred<ReorderCommitResult>();
    const reorder = vi.fn().mockReturnValue(promise);
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    const call = onReorder({ expectedOrderedIds: [idA, idB, idC], orderedIds: [idB, idA, idC] });

    canonicalIds.value = [idB, idA, idC];
    await nextTick();

    expect(isPending.value).toBe(true);

    reject(new Error('network down'));
    await call;

    expect(isPending.value).toBe(false);
    expect(displayIds.value).toEqual([idB, idA, idC]);
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh token after a stale rollback and stays unaffected by the retired request', async () => {
    const canonicalIds = ref<readonly DatabaseViewId[]>([idA, idB, idC]);
    const first = deferred<ReorderCommitResult>();
    const second = deferred<ReorderCommitResult>();
    const reorder = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { displayIds, isPending, onReorder } = useDatabaseViewReorderState(
      computed(() => canonicalIds.value),
      reorder,
    );

    const firstCall = onReorder({
      expectedOrderedIds: [idA, idB, idC],
      orderedIds: [idB, idA, idC],
    });

    first.resolve('stale');

    // A second drag attempted before the first request's continuation has run must stay
    // blocked by the single-flight guard rather than racing the still-current token.
    const blockedAttempt = onReorder({
      expectedOrderedIds: [idA, idB, idC],
      orderedIds: [idC, idA, idB],
    });

    await Promise.all([firstCall, blockedAttempt]);

    expect(isPending.value).toBe(false);
    expect(reorder).toHaveBeenCalledTimes(1);

    const secondCall = onReorder({
      expectedOrderedIds: [idA, idB, idC],
      orderedIds: [idC, idB, idA],
    });

    expect(isPending.value).toBe(true);

    second.resolve('applied');
    await secondCall;

    // Retiring the first token must not leave residual state that affects the second request.
    expect(displayIds.value).toEqual([idC, idB, idA]);
    expect(reorder).toHaveBeenCalledTimes(2);
  });
});
