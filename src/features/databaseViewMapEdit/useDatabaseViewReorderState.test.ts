import { effectScope, nextTick, ref, type Ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useDatabaseViewReorderState } from './useDatabaseViewReorderState';

// The composable has no lifecycle hooks, so it can be exercised directly inside
// an effect scope without mounting a component or a real dnd-kit drag session.
const setupState = (canonicalIds: Ref<string[]>, commit = vi.fn()) => {
  const scope = effectScope();
  const state = scope.run(() => useDatabaseViewReorderState(canonicalIds, commit));

  if (!state) {
    throw new Error('effect scope did not run');
  }

  return { ...state, commit, scope };
};

describe('useDatabaseViewReorderState', () => {
  it('renders the canonical order while idle', () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const { displayIds, scope } = setupState(canonicalIds);

    expect(displayIds.value).toEqual(['a', 'b', 'c']);
    scope.stop();
  });

  it('commits the moved order once for a changed completed drag', () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockResolvedValue(undefined);
    const { onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: false, isSortableSource: true, fromIndex: 0, toIndex: 2 });

    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith(['b', 'c', 'a']);
    expect(displayIds.value).toEqual(['b', 'c', 'a']);
    scope.stop();
  });

  it('does not commit when the drag is canceled', () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: true, isSortableSource: true, fromIndex: 0, toIndex: 2 });

    expect(commit).not.toHaveBeenCalled();
    expect(displayIds.value).toEqual(['a', 'b', 'c']);
    scope.stop();
  });

  it('does not commit when the drag ends at the same index (unchanged)', () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: false, isSortableSource: true, fromIndex: 1, toIndex: 1 });

    expect(commit).not.toHaveBeenCalled();
    expect(displayIds.value).toEqual(['a', 'b', 'c']);
    scope.stop();
  });

  it('does not commit when the drag operation was not a sortable source', () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn();
    const { onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: false, isSortableSource: false, fromIndex: 0, toIndex: 2 });

    expect(commit).not.toHaveBeenCalled();
    expect(displayIds.value).toEqual(['a', 'b', 'c']);
    scope.stop();
  });

  it('keeps the frozen snapshot while a drag is active, ignoring a concurrent canonical update', () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const { onDragStart, displayIds, scope } = setupState(canonicalIds);

    onDragStart();
    canonicalIds.value = ['a', 'b', 'c', 'd'];

    expect(displayIds.value).toEqual(['a', 'b', 'c']);
    scope.stop();
  });

  it('normalizes the frozen snapshot against latest canonical membership once the drag ends', () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockResolvedValue(undefined);
    const { onDragStart, onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragStart();
    canonicalIds.value = ['a', 'b', 'd'];
    onDragEnd({ canceled: false, isSortableSource: true, fromIndex: 0, toIndex: 1 });

    expect(displayIds.value).toEqual(['b', 'a', 'd']);
    scope.stop();
  });

  it('clears the optimistic order once canonical state confirms the commit', async () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockResolvedValue(undefined);
    const { onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: false, isSortableSource: true, fromIndex: 0, toIndex: 2 });
    expect(displayIds.value).toEqual(['b', 'c', 'a']);

    canonicalIds.value = ['b', 'c', 'a'];
    await nextTick();

    // Observable only through a later, differently-ordered canonical update: if the pending
    // order were not actually cleared, normalizeDisplayOrder would keep rendering the stale
    // pending order here instead of adopting the fresh canonical order.
    canonicalIds.value = ['c', 'a', 'b'];
    await nextTick();

    expect(displayIds.value).toEqual(['c', 'a', 'b']);
    scope.stop();
  });

  it('does not clear the optimistic order when canonical changes without matching it', async () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockResolvedValue(undefined);
    const { onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: false, isSortableSource: true, fromIndex: 0, toIndex: 2 });
    expect(displayIds.value).toEqual(['b', 'c', 'a']);

    // Same membership as the pending order, but a different (non-matching) order.
    canonicalIds.value = ['c', 'a', 'b'];
    await nextTick();

    // The pending order is preserved verbatim rather than adopting the new canonical order.
    expect(displayIds.value).toEqual(['b', 'c', 'a']);
    scope.stop();
  });

  it('does not clear the optimistic order for a canonical update while a drag is frozen', async () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockResolvedValue(undefined);
    const { onDragStart, onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: false, isSortableSource: true, fromIndex: 0, toIndex: 2 });
    expect(displayIds.value).toEqual(['b', 'c', 'a']);

    onDragStart();
    // Exactly matches the pending order, but arrives while frozen: must not clear yet.
    canonicalIds.value = ['b', 'c', 'a'];
    await nextTick();
    onDragEnd({ canceled: true, isSortableSource: false, fromIndex: 0, toIndex: 0 });

    // Unfrozen with no further canonical change: a wrongly-cleared pending order and the
    // still-pending order both normalize to the same membership here, so distinguish by
    // reordering canonical once more and checking the pending order was preserved through it.
    canonicalIds.value = ['c', 'a', 'b'];
    await nextTick();
    expect(displayIds.value).toEqual(['b', 'c', 'a']);
    scope.stop();
  });

  it('resets to the latest canonical order on commit rejection', async () => {
    const canonicalIds = ref(['a', 'b', 'c']);
    const commit = vi.fn().mockRejectedValue(new Error('persist failed'));
    const { onDragEnd, displayIds, scope } = setupState(canonicalIds, commit);

    onDragEnd({ canceled: false, isSortableSource: true, fromIndex: 0, toIndex: 2 });
    expect(displayIds.value).toEqual(['b', 'c', 'a']);

    await vi.waitFor(() => {
      expect(displayIds.value).toEqual(['a', 'b', 'c']);
    });
    scope.stop();
  });
});
