import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import { Repo } from '@automerge/automerge-repo';
import type { AMDocumentId } from '@shared/lib/automerge';
import { DB_VIEW_LAYOUT, generateViewId } from '@shared/lib/databaseDocument';

const useDatabaseViewsMock = vi.fn();

vi.mock('./useDatabaseViews', () => ({
  useDatabaseViews: (...args: unknown[]) => useDatabaseViewsMock(...args),
}));

const createDocumentId = (): AMDocumentId => {
  const repo = new Repo();
  const handle = repo.create({});

  return handle.documentId;
};

describe('useDatabaseViewSelection', () => {
  beforeEach(() => {
    vi.resetModules();
    useDatabaseViewsMock.mockReset();
  });

  it('returns the first ordered view when there is no explicit selection', async () => {
    const firstViewId = generateViewId();
    const secondViewId = generateViewId();
    const viewEntries = [
      [firstViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'default view' }],
      [secondViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'secondary view' }],
    ];
    const viewList = ref(viewEntries);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewId = ref<ReturnType<typeof generateViewId> | undefined>();

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    expect(selection.viewList.value).toEqual(viewEntries);
    expect(selection.effectiveViewId.value).toBe(firstViewId);
  });

  it('returns the explicit selection when it exists in the current view list', async () => {
    const firstViewId = generateViewId();
    const explicitViewIdValue = generateViewId();
    const viewEntries = [
      [firstViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'default view' }],
      [explicitViewIdValue, { layout: DB_VIEW_LAYOUT.TABLE, name: 'secondary view' }],
    ];
    const viewList = ref(viewEntries);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewId = ref(explicitViewIdValue);

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    expect(selection.effectiveViewId.value).toBe(explicitViewIdValue);
  });

  it('writes explicit selection changes back through the public computed ref when the state is writable', async () => {
    const firstViewId = generateViewId();
    const secondViewId = generateViewId();
    const viewEntries = [
      [firstViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'default view' }],
      [secondViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'secondary view' }],
    ];
    const viewList = ref(viewEntries);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewId = ref<ReturnType<typeof generateViewId> | undefined>(firstViewId);

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    selection.explicitViewId.value = secondViewId;

    expect(selection.explicitViewId.value).toBe(secondViewId);
    expect(selection.effectiveViewId.value).toBe(secondViewId);
  });

  it('keeps the current explicit selection while the view list is still unavailable', async () => {
    const explicitViewIdValue = generateViewId();
    const viewList = ref<
      | readonly (readonly [
          ReturnType<typeof generateViewId>,
          { layout: DB_VIEW_LAYOUT.TABLE; name: string },
        ])[]
      | undefined
    >(undefined);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(true),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewId = ref(explicitViewIdValue);

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    await nextTick();

    expect(selection.explicitViewId.value).toBe(explicitViewIdValue);
    expect(selection.effectiveViewId.value).toBe(explicitViewIdValue);
  });

  it('falls back to the first view and clears stale explicit selection when the selected view disappears', async () => {
    const firstViewId = generateViewId();
    const removedViewId = generateViewId();
    const initialViewEntries = [
      [firstViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'default view' }],
      [removedViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'secondary view' }],
    ];
    const nextViewEntries = [[firstViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'default view' }]];
    const viewList = ref(initialViewEntries);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewId = ref(removedViewId);

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    viewList.value = nextViewEntries;
    await nextTick();

    expect(selection.explicitViewId.value).toBeUndefined();
    expect(selection.effectiveViewId.value).toBe(firstViewId);
  });

  it('clears a stale explicit selection immediately when the current view list is already known', async () => {
    const firstViewId = generateViewId();
    const staleViewId = generateViewId();
    const viewEntries = [[firstViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'default view' }]];
    const viewList = ref(viewEntries);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewId = ref(staleViewId);

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    await nextTick();

    expect(selection.explicitViewId.value).toBeUndefined();
    expect(selection.effectiveViewId.value).toBe(firstViewId);
  });

  it('returns undefined only when the view list is truly empty', async () => {
    const emptyViewList: readonly [] = [];
    const viewList = ref(emptyViewList);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewId = ref<ReturnType<typeof generateViewId> | undefined>();

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    expect(selection.effectiveViewId.value).toBeUndefined();
  });

  it('does not mutate readonly explicit selection state when a caller only needs read-side fallback', async () => {
    const firstViewId = generateViewId();
    const staleViewId = generateViewId();
    const viewEntries = [[firstViewId, { layout: DB_VIEW_LAYOUT.TABLE, name: 'default view' }]];
    const viewList = ref(viewEntries);

    useDatabaseViewsMock.mockReturnValue({
      views: viewList,
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseViewSelection } = await import('./useDatabaseViewSelection');
    const explicitViewIdState = ref(staleViewId);
    const explicitViewId = computed(() => explicitViewIdState.value);

    const selection = useDatabaseViewSelection(
      ref('/tmp'),
      ref(createDocumentId()),
      explicitViewId,
    );

    selection.setExplicitViewId(firstViewId);
    selection.clearExplicitViewId();
    await nextTick();

    expect(selection.explicitViewId.value).toBe(staleViewId);
    expect(selection.effectiveViewId.value).toBe(firstViewId);
  });
});
