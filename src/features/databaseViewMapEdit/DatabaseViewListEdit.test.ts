import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { h, nextTick, ref, type Directive, type Ref } from 'vue';
import {
  DB_VIEW_LAYOUT,
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { ReorderDragEndEvent, ReorderMoveEvent, UseReorderOptions } from '@shared/lib/reorder';
import { MDListItem } from '@shared/ui/Lists';
import DatabaseViewListEdit from './DatabaseViewListEdit.vue';

const FAKE_VIEW_ID_A = generateViewId();
const FAKE_VIEW_ID_B = generateViewId();
const FAKE_DOC_ID = new Repo().create({}).documentId;

const fakeView = (name: string): DatabaseView => ({ name, layout: DB_VIEW_LAYOUT.TABLE });

/**
 * Spy directive: records every `mounted` invocation's element so the wiring tests below can
 * assert which DOM element the component applied it to, without inspecting private `MDListItem`
 * internals.
 * @returns A directive object exposing the `mountedEls` it recorded.
 */
const createSpyDirective = (): Directive & { mountedEls: HTMLElement[] } => {
  const mountedEls: HTMLElement[] = [];
  return {
    mounted: (el: HTMLElement) => {
      mountedEls.push(el);
    },
    unmounted: () => {},
    mountedEls,
  };
};

interface ReorderHarness {
  options: UseReorderOptions<DatabaseViewId>;
  draggingKey: Ref<DatabaseViewId | null>;
  vReorderContainer: ReturnType<typeof createSpyDirective>;
  vReorderItem: ReturnType<typeof createSpyDirective>;
  vReorderActivator: ReturnType<typeof createSpyDirective>;
  vReorderIgnore: ReturnType<typeof createSpyDirective>;
}

let lastReorderHarness: ReorderHarness | undefined;
let currentViews: Ref<ReadonlyArray<readonly [DatabaseViewId, DatabaseView]>>;
let reorderMock: Mock<(orderedIds: DatabaseViewId[]) => Promise<unknown>>;

vi.mock('@entity/databaseView', () => ({
  useDatabaseViews: () => ({
    reorder: (orderedIds: DatabaseViewId[]) => reorderMock(orderedIds),
    views: currentViews,
  }),
}));

vi.mock('@shared/lib/reorder', () => ({
  useReorder: (options: UseReorderOptions<DatabaseViewId>) => {
    const draggingKey = ref<DatabaseViewId | null>(null);
    const harness: ReorderHarness = {
      options,
      draggingKey,
      vReorderContainer: createSpyDirective(),
      vReorderItem: createSpyDirective(),
      vReorderActivator: createSpyDirective(),
      vReorderIgnore: createSpyDirective(),
    };
    lastReorderHarness = harness;

    return {
      draggingKey,
      vReorderContainer: harness.vReorderContainer,
      vReorderItem: harness.vReorderItem,
      vReorderActivator: harness.vReorderActivator,
      vReorderIgnore: harness.vReorderIgnore,
    };
  },
}));

const mountEdit = (
  slots: Record<string, () => unknown> = {},
  props: Record<string, unknown> = {},
  views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
    [FAKE_VIEW_ID_A, fakeView('My View')],
  ],
) => {
  currentViews = ref(views);
  reorderMock = vi
    .fn<(orderedIds: DatabaseViewId[]) => Promise<unknown>>()
    .mockResolvedValue(undefined);
  lastReorderHarness = undefined;

  return mount(DatabaseViewListEdit, {
    attachTo: document.body,
    props: {
      directoryPath: '/db',
      documentId: FAKE_DOC_ID,
      ...props,
    },
    slots,
  });
};

const getHarness = (): ReorderHarness => {
  if (!lastReorderHarness) throw new Error('useReorder was not called');
  return lastReorderHarness;
};

describe('DatabaseViewListEdit', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders single-action rows when no trailingAction slot is provided', () => {
    const wrapper = mountEdit();

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('.md-list-item__trailing-action').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('renders multi-action rows when trailingAction slot is provided', () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);

    const nestedInPrimary = wrapper
      .find('.md-list-item__primary-action')
      .find('[data-testid="trailing-btn"]');
    expect(nestedInPrimary.exists()).toBe(false);
  });

  it('does not nest trailing action inside the primary action surface', () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    const primaryAction = wrapper.find('.md-list-item__primary-action');
    expect(primaryAction.exists()).toBe(true);
    expect(primaryAction.find('button[data-testid="trailing-btn"]').exists()).toBe(false);
  });

  it('exposes the current view accessibly via aria-current on the row', () => {
    const wrapper = mountEdit({}, { currentViewId: FAKE_VIEW_ID_A });

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBe('true');
  });

  it('does not set aria-current when the view is not the current one', () => {
    const wrapper = mountEdit();

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBeUndefined();
  });

  it('applies both vReorderItem and vReorderActivator to the same row element', () => {
    mountEdit();

    const harness = getHarness();
    expect(harness.vReorderItem.mountedEls).toHaveLength(1);
    expect(harness.vReorderActivator.mountedEls).toHaveLength(1);
    expect(harness.vReorderItem.mountedEls[0]).toBe(harness.vReorderActivator.mountedEls[0]);
  });

  it('wraps the trailing slot in an element carrying vReorderIgnore', () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    const harness = getHarness();
    expect(harness.vReorderIgnore.mountedEls).toHaveLength(1);

    const ignoreEl = harness.vReorderIgnore.mountedEls[0];
    const trailingButton = wrapper.get('[data-testid="trailing-btn"]').element;
    expect(ignoreEl?.contains(trailingButton)).toBe(true);
  });

  it('drives MDListItem.dragged from the reorder library draggingKey', async () => {
    const wrapper = mountEdit();
    const harness = getHarness();

    expect(wrapper.findComponent(MDListItem).props('dragged')).toBe(false);

    harness.draggingKey.value = FAKE_VIEW_ID_A;
    await nextTick();

    expect(wrapper.findComponent(MDListItem).props('dragged')).toBe(true);
  });

  it('emits clickView on a primary row click', async () => {
    const wrapper = mountEdit();

    await wrapper.get('.md-list-item__primary-action').trigger('click');

    expect(wrapper.emitted('clickView')).toEqual([[FAKE_VIEW_ID_A]]);
  });

  it('does not emit clickView from a trailing slot click', async () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    await wrapper.get('[data-testid="trailing-btn"]').trigger('click');

    expect(wrapper.emitted('clickView')).toBeUndefined();
  });

  describe('controlled order and persistence', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('Alpha')],
      [FAKE_VIEW_ID_B, fakeView('Bravo')],
    ];

    it('onReorder updates the local order synchronously without persisting', async () => {
      const wrapper = mountEdit({}, {}, views);
      const harness = getHarness();

      const moveEvent: ReorderMoveEvent<DatabaseViewId> = {
        key: FAKE_VIEW_ID_A,
        fromIndex: 0,
        toIndex: 1,
      };
      harness.options.onReorder(moveEvent);

      expect(reorderMock).not.toHaveBeenCalled();
      await nextTick();
      const labels = wrapper.findAllComponents(MDListItem).map((item) => item.props('labelText'));
      expect(labels).toEqual(['Bravo', 'Alpha']);
    });

    it('persists exactly once after a changed, non-cancelled drag', () => {
      mountEdit({}, {}, views);
      const harness = getHarness();

      harness.options.onReorder({ key: FAKE_VIEW_ID_A, fromIndex: 0, toIndex: 1 });

      const dragEndEvent: ReorderDragEndEvent<DatabaseViewId> = {
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 1,
        cancelled: false,
      };
      harness.options.onDragEnd?.(dragEndEvent);

      expect(reorderMock).toHaveBeenCalledTimes(1);
      expect(reorderMock).toHaveBeenCalledWith([FAKE_VIEW_ID_B, FAKE_VIEW_ID_A]);
    });

    it('does not persist a cancelled drag', () => {
      mountEdit({}, {}, views);
      const harness = getHarness();

      harness.options.onReorder({ key: FAKE_VIEW_ID_A, fromIndex: 0, toIndex: 1 });
      harness.options.onDragEnd?.({
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 1,
        cancelled: true,
      });

      expect(reorderMock).not.toHaveBeenCalled();
    });

    it('does not persist a completed drag that ends with the unchanged order', () => {
      mountEdit({}, {}, views);
      const harness = getHarness();

      harness.options.onDragEnd?.({
        key: FAKE_VIEW_ID_A,
        initialIndex: 0,
        finalIndex: 0,
        cancelled: false,
      });

      expect(reorderMock).not.toHaveBeenCalled();
    });
  });
});
