import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useReorderCommit } from './useReorderCommit';
import type { ReorderCommitResult } from './types';

const dragEnd = (
  fromIndex: number,
  toIndex: number,
  overrides: Partial<{
    canceled: boolean;
    isSortableSource: boolean;
  }> = {},
) => ({
  canceled: false,
  isSortableSource: true,
  fromIndex,
  toIndex,
  ...overrides,
});

describe('useReorderCommit', () => {
  it('renders the canonical order while idle', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    const { displayItemIds } = useReorderCommit(itemIds, vi.fn());

    expect(displayItemIds.value).toEqual(['a', 'b', 'c']);

    itemIds.value = ['a', 'c', 'b'];
    await nextTick();

    expect(displayItemIds.value).toEqual(['a', 'c', 'b']);
  });

  it('produces the correct commit request for a changed drag', () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockResolvedValue('applied' satisfies ReorderCommitResult);
    const { onDragStart, onDragEnd } = useReorderCommit(itemIds, commit);

    onDragStart();
    onDragEnd(dragEnd(0, 2));

    expect(commit).toHaveBeenCalledExactlyOnceWith({
      expectedOrderedIds: ['a', 'b', 'c'],
      orderedIds: ['b', 'c', 'a'],
    });
  });

  it('does not commit a canceled drag', () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragStart, onDragEnd } = useReorderCommit(itemIds, commit);

    onDragStart();
    onDragEnd(dragEnd(0, 2, { canceled: true }));

    expect(commit).not.toHaveBeenCalled();
  });

  it('does not commit a non-sortable source', () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragStart, onDragEnd } = useReorderCommit(itemIds, commit);

    onDragStart();
    onDragEnd(dragEnd(0, 2, { isSortableSource: false }));

    expect(commit).not.toHaveBeenCalled();
  });

  it('does not commit an unchanged index', () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragStart, onDragEnd } = useReorderCommit(itemIds, commit);

    onDragStart();
    onDragEnd(dragEnd(1, 1));

    expect(commit).not.toHaveBeenCalled();
  });

  it('does not commit an out-of-range target index', () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragStart, onDragEnd } = useReorderCommit(itemIds, commit);

    onDragStart();
    onDragEnd(dragEnd(5, 0));

    expect(commit).not.toHaveBeenCalled();
  });

  it('invalidates the drag when the canonical order changes mid-drag, and does not commit', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragStart, onDragEnd, displayItemIds } = useReorderCommit(itemIds, commit);

    onDragStart();

    itemIds.value = ['a', 'b', 'c', 'd'];
    await nextTick();

    expect(displayItemIds.value).toEqual(['a', 'b', 'c']);

    onDragEnd(dragEnd(0, 2));

    expect(commit).not.toHaveBeenCalled();
    expect(displayItemIds.value).toEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps a valid optimistic order across a delayed re-emission of the base canonical order', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn(() => new Promise<ReorderCommitResult>(() => {}));
    const { onDragStart, onDragEnd, displayItemIds, isCommitPending } = useReorderCommit(
      itemIds,
      commit,
    );

    onDragStart();
    onDragEnd(dragEnd(0, 2));

    expect(displayItemIds.value).toEqual(['b', 'c', 'a']);

    itemIds.value = ['a', 'b', 'c'];
    await nextTick();

    expect(displayItemIds.value).toEqual(['b', 'c', 'a']);
    expect(isCommitPending.value).toBe(true);
  });

  it('clears optimistic state once the canonical order confirms the commit', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn(() => new Promise<ReorderCommitResult>(() => {}));
    const { onDragStart, onDragEnd, displayItemIds, isCommitPending } = useReorderCommit(
      itemIds,
      commit,
    );

    onDragStart();
    onDragEnd(dragEnd(0, 2));

    itemIds.value = ['b', 'c', 'a'];
    await nextTick();

    expect(displayItemIds.value).toEqual(['b', 'c', 'a']);
    expect(isCommitPending.value).toBe(false);
  });

  it('clears optimistic state on a conflicting authoritative canonical order', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn(() => new Promise<ReorderCommitResult>(() => {}));
    const { onDragStart, onDragEnd, displayItemIds, isCommitPending } = useReorderCommit(
      itemIds,
      commit,
    );

    onDragStart();
    onDragEnd(dragEnd(0, 2));

    itemIds.value = ['c', 'a', 'b'];
    await nextTick();

    expect(displayItemIds.value).toEqual(['c', 'a', 'b']);
    expect(isCommitPending.value).toBe(false);
  });

  it('rolls back to canonical when the commit resolves stale', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockResolvedValue('stale' satisfies ReorderCommitResult);
    const { onDragStart, onDragEnd, displayItemIds, isCommitPending } = useReorderCommit(
      itemIds,
      commit,
    );

    onDragStart();
    onDragEnd(dragEnd(0, 2));
    await vi.waitFor(() => {
      expect(isCommitPending.value).toBe(false);
    });

    expect(displayItemIds.value).toEqual(['a', 'b', 'c']);
  });

  it('rolls back to canonical when the commit rejects', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockRejectedValue(new Error('commit failed'));
    const { onDragStart, onDragEnd, displayItemIds, isCommitPending } = useReorderCommit(
      itemIds,
      commit,
    );

    onDragStart();
    onDragEnd(dragEnd(0, 2));
    await vi.waitFor(() => {
      expect(isCommitPending.value).toBe(false);
    });

    expect(displayItemIds.value).toEqual(['a', 'b', 'c']);
  });

  it('disables activation state while a commit is unresolved', () => {
    const itemIds = ref(['a', 'b', 'c']);
    const commit = vi.fn(() => new Promise<ReorderCommitResult>(() => {}));
    const { onDragStart, onDragEnd, isCommitPending } = useReorderCommit(itemIds, commit);

    expect(isCommitPending.value).toBe(false);

    onDragStart();
    onDragEnd(dragEnd(0, 2));

    expect(isCommitPending.value).toBe(true);
  });

  it('ignores a completion from an invalidated token and preserves the newer commit state', async () => {
    const itemIds = ref(['a', 'b', 'c']);
    let resolveFirst: ((result: ReorderCommitResult) => void) | undefined;
    const firstCommitPromise = new Promise<ReorderCommitResult>((resolve) => {
      resolveFirst = resolve;
    });
    const commit = vi
      .fn()
      .mockReturnValueOnce(firstCommitPromise)
      .mockReturnValueOnce(new Promise<ReorderCommitResult>(() => {}));
    const { onDragStart, onDragEnd, displayItemIds, isCommitPending } = useReorderCommit(
      itemIds,
      commit,
    );

    onDragStart();
    onDragEnd(dragEnd(0, 2));

    itemIds.value = ['c', 'a', 'b'];
    await nextTick();
    expect(isCommitPending.value).toBe(false);

    onDragStart();
    onDragEnd(dragEnd(0, 1));
    expect(isCommitPending.value).toBe(true);
    const secondOptimisticOrder = displayItemIds.value;

    resolveFirst?.('stale');
    await Promise.resolve();
    await Promise.resolve();

    expect(displayItemIds.value).toEqual(secondOptimisticOrder);
    expect(isCommitPending.value).toBe(true);
  });
});
