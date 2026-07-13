import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { computed, h, nextTick, ref, type Directive, type Ref } from 'vue';
import {
  DB_VIEW_LAYOUT,
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDListItem } from '@shared/ui/Lists';
import DatabaseViewListEdit from './DatabaseViewListEdit.vue';
import { useDatabaseViewListReorder } from './useDatabaseViewListReorder';

const FAKE_VIEW_ID_A = generateViewId();
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

let currentViews: Ref<ReadonlyArray<readonly [DatabaseViewId, DatabaseView]>>;
let reorderMock: Mock<(orderedIds: DatabaseViewId[]) => Promise<unknown>>;

vi.mock('@entity/databaseView', () => ({
  useDatabaseViews: () => ({
    reorder: (orderedIds: DatabaseViewId[]) => reorderMock(orderedIds),
    views: currentViews,
  }),
}));

vi.mock('./useDatabaseViewListReorder', () => ({
  useDatabaseViewListReorder: vi.fn(),
}));

const useDatabaseViewListReorderMock = vi.mocked(useDatabaseViewListReorder);

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

  const draggingKey = ref<DatabaseViewId | null>(null);
  const vReorderContainer = createSpyDirective();
  const vReorderItem = createSpyDirective();
  const vReorderActivator = createSpyDirective();
  const vReorderIgnore = createSpyDirective();
  const orderedViewListSource = ref<Array<readonly [DatabaseViewId, DatabaseView]>>([...views]);
  const orderedViewList = computed(() => orderedViewListSource.value);

  useDatabaseViewListReorderMock.mockReset().mockReturnValue({
    orderedViewList,
    draggingKey,
    vReorderContainer,
    vReorderItem,
    vReorderActivator,
    vReorderIgnore,
  });

  const wrapper = mount(DatabaseViewListEdit, {
    attachTo: document.body,
    props: {
      directoryPath: '/db',
      documentId: FAKE_DOC_ID,
      ...props,
    },
    slots,
  });

  return {
    wrapper,
    draggingKey,
    vReorderContainer,
    vReorderItem,
    vReorderActivator,
    vReorderIgnore,
    orderedViewList: orderedViewListSource,
  };
};

describe('DatabaseViewListEdit', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders single-action rows when no trailingAction slot is provided', () => {
    const { wrapper } = mountEdit();

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('.md-list-item__trailing-action').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('renders multi-action rows when trailingAction slot is provided', () => {
    const { wrapper } = mountEdit({
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
    const { wrapper } = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    const primaryAction = wrapper.find('.md-list-item__primary-action');
    expect(primaryAction.exists()).toBe(true);
    expect(primaryAction.find('button[data-testid="trailing-btn"]').exists()).toBe(false);
  });

  it('exposes the current view accessibly via aria-current on the row', () => {
    const { wrapper } = mountEdit({}, { currentViewId: FAKE_VIEW_ID_A });

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBe('true');
  });

  it('does not set aria-current when the view is not the current one', () => {
    const { wrapper } = mountEdit();

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBeUndefined();
  });

  it('applies both vReorderItem and vReorderActivator to the same row element', () => {
    const { vReorderItem, vReorderActivator } = mountEdit();

    expect(vReorderItem.mountedEls).toHaveLength(1);
    expect(vReorderActivator.mountedEls).toHaveLength(1);
    expect(vReorderItem.mountedEls[0]).toBe(vReorderActivator.mountedEls[0]);
  });

  it('wraps the trailing slot in an element carrying vReorderIgnore', () => {
    const { wrapper, vReorderIgnore } = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    expect(vReorderIgnore.mountedEls).toHaveLength(1);

    const ignoreEl = vReorderIgnore.mountedEls[0];
    const trailingButton = wrapper.get('[data-testid="trailing-btn"]').element;
    expect(ignoreEl?.contains(trailingButton)).toBe(true);
  });

  it('drives MDListItem.dragged from the composable draggingKey', async () => {
    const { wrapper, draggingKey } = mountEdit();

    expect(wrapper.findComponent(MDListItem).props('dragged')).toBe(false);

    draggingKey.value = FAKE_VIEW_ID_A;
    await nextTick();

    expect(wrapper.findComponent(MDListItem).props('dragged')).toBe(true);
  });

  it('emits clickView on a primary row click', async () => {
    const { wrapper } = mountEdit();

    await wrapper.get('.md-list-item__primary-action').trigger('click');

    expect(wrapper.emitted('clickView')).toEqual([[FAKE_VIEW_ID_A]]);
  });

  it('does not emit clickView from a trailing slot click', async () => {
    const { wrapper } = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    await wrapper.get('[data-testid="trailing-btn"]').trigger('click');

    expect(wrapper.emitted('clickView')).toBeUndefined();
  });

  it('passes views from useDatabaseViews and persistOrder from reorder into useDatabaseViewListReorder', () => {
    const views: ReadonlyArray<readonly [DatabaseViewId, DatabaseView]> = [
      [FAKE_VIEW_ID_A, fakeView('My View')],
    ];
    mountEdit({}, {}, views);

    expect(useDatabaseViewListReorderMock).toHaveBeenCalledTimes(1);
    const options = useDatabaseViewListReorderMock.mock.calls[0]?.[0];
    expect(options?.views.value).toBe(currentViews.value);

    void options?.persistOrder([FAKE_VIEW_ID_A]);
    expect(reorderMock).toHaveBeenCalledWith([FAKE_VIEW_ID_A]);
  });

  it('renders the views in the order returned by useDatabaseViewListReorder', async () => {
    const { wrapper, orderedViewList } = mountEdit({}, {}, [[FAKE_VIEW_ID_A, fakeView('My View')]]);

    const otherId = generateViewId();
    orderedViewList.value = [
      [otherId, fakeView('Other View')],
      [FAKE_VIEW_ID_A, fakeView('My View')],
    ];
    await nextTick();

    const labels = wrapper.findAllComponents(MDListItem).map((item) => item.props('labelText'));
    expect(labels).toEqual(['Other View', 'My View']);
  });
});
