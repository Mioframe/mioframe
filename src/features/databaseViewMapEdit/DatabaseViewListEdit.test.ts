import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, ref } from 'vue';
import { generateViewId } from '@shared/lib/databaseDocument';
import DatabaseViewListEdit from './DatabaseViewListEdit.vue';

const FAKE_VIEW_ID = generateViewId();
const OTHER_VIEW_ID = generateViewId();
const FAKE_DOC_ID = new Repo().create({}).documentId;
const INVALID_ID = 'not-a-database-view-id';

const reorderMock = vi.fn();
let viewsState: Array<[string, { name: string }]> | undefined = [
  [FAKE_VIEW_ID, { name: 'My View' }],
];

vi.mock('@entity/databaseView', () => ({
  useDatabaseViews: () => ({
    reorder: reorderMock,
    views: ref(viewsState),
  }),
}));

interface MockedReorderSurfaceOptions {
  itemIdList: { value: string[] };
  onCommit: (payload: { orderedIds: string[] }) => unknown;
}

const { useReorderSurfaceMock } = vi.hoisted(() => ({
  useReorderSurfaceMock: vi.fn((_container: unknown, _options: unknown) => ({
    displayItemIdList: ref<string[]>([FAKE_VIEW_ID]),
    draggedId: ref<string | undefined>(undefined),
    isDragging: ref(false),
  })),
}));

// Keep the real directives: they are part of the row markup contract under test.
// Only the composable is mocked, to capture the configuration and commit wiring.
vi.mock('@shared/lib/sortable', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/lib/sortable')>()),
  useReorderSurface: useReorderSurfaceMock,
}));

const mountEdit = (
  slots: Record<string, () => unknown> = {},
  props: Record<string, unknown> = {},
) =>
  mount(DatabaseViewListEdit, {
    attachTo: document.body,
    props: {
      directoryPath: '/db',
      documentId: FAKE_DOC_ID,
      ...props,
    },
    slots,
  });

const getMockedOptions = (callIndex = 0): MockedReorderSurfaceOptions =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrows the mock's untyped captured call args to the shape the component actually passes
  useReorderSurfaceMock.mock.calls[callIndex]?.[1] as MockedReorderSurfaceOptions;

describe('DatabaseViewListEdit', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    useReorderSurfaceMock.mockClear();
    reorderMock.mockClear();
    viewsState = [[FAKE_VIEW_ID, { name: 'My View' }]];
  });

  it('uses the simple reorder surface contract without engine tuning options', () => {
    mountEdit();

    const options = getMockedOptions();

    expect(options.itemIdList).toBeDefined();
    expect(options.onCommit).toBeTypeOf('function');
    expect(options).not.toHaveProperty('activation');
    expect(options).not.toHaveProperty('interactiveStrategy');
    expect(options).not.toHaveProperty('layout');
  });

  it('passes the MDList root element as the reorder surface container', () => {
    mountEdit();

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrows the mock's untyped captured call args to the container ref shape the component actually passes
    const [containerArg] = useReorderSurfaceMock.mock.calls[0] as [{ value: unknown }, unknown];
    expect(containerArg.value).toBeInstanceOf(HTMLElement);
  });

  it('derives itemIdList from the current view list', () => {
    viewsState = [
      [FAKE_VIEW_ID, { name: 'My View' }],
      [OTHER_VIEW_ID, { name: 'Other View' }],
    ];

    mountEdit();

    expect(getMockedOptions().itemIdList.value).toEqual([FAKE_VIEW_ID, OTHER_VIEW_ID]);
  });

  it('derives an empty itemIdList when there are no views yet', () => {
    viewsState = undefined;

    mountEdit();

    expect(getMockedOptions().itemIdList.value).toEqual([]);
  });

  it('commits a reorder through the entity when every id is a valid database view id', () => {
    viewsState = [
      [FAKE_VIEW_ID, { name: 'My View' }],
      [OTHER_VIEW_ID, { name: 'Other View' }],
    ];
    mountEdit();

    getMockedOptions().onCommit({ orderedIds: [OTHER_VIEW_ID, FAKE_VIEW_ID] });

    expect(reorderMock).toHaveBeenCalledWith([OTHER_VIEW_ID, FAKE_VIEW_ID]);
  });

  it('does not commit a reorder when any id fails database view id validation', () => {
    mountEdit();

    getMockedOptions().onCommit({ orderedIds: [FAKE_VIEW_ID, INVALID_ID] });

    expect(reorderMock).not.toHaveBeenCalled();
  });

  it('filters out ids that are not valid database view ids from the displayed order', () => {
    viewsState = [
      [FAKE_VIEW_ID, { name: 'My View' }],
      [OTHER_VIEW_ID, { name: 'Other View' }],
    ];
    useReorderSurfaceMock.mockReturnValueOnce({
      displayItemIdList: ref<string[]>([FAKE_VIEW_ID, INVALID_ID, OTHER_VIEW_ID]),
      draggedId: ref<string | undefined>(undefined),
      isDragging: ref(false),
    });

    const wrapper = mountEdit();

    expect(wrapper.findAll('.md-list-item').length).toBe(2);
  });

  it('skips display ids that no longer exist in the current view map', () => {
    viewsState = [[FAKE_VIEW_ID, { name: 'My View' }]];
    useReorderSurfaceMock.mockReturnValueOnce({
      displayItemIdList: ref<string[]>([FAKE_VIEW_ID, OTHER_VIEW_ID]),
      draggedId: ref<string | undefined>(undefined),
      isDragging: ref(false),
    });

    const wrapper = mountEdit();

    expect(wrapper.findAll('.md-list-item').length).toBe(1);
  });

  it('marks the row matching the dragged id as dragged', () => {
    useReorderSurfaceMock.mockReturnValueOnce({
      displayItemIdList: ref<string[]>([FAKE_VIEW_ID]),
      draggedId: ref<string | undefined>(FAKE_VIEW_ID),
      isDragging: ref(true),
    });

    const wrapper = mountEdit();

    expect(wrapper.get('.md-list-item').classes()).toContain('md-state_dragged');
  });

  it('does not mark a row as dragged when the dragged id fails database view id validation', () => {
    useReorderSurfaceMock.mockReturnValueOnce({
      displayItemIdList: ref<string[]>([FAKE_VIEW_ID]),
      draggedId: ref<string | undefined>(INVALID_ID),
      isDragging: ref(true),
    });

    const wrapper = mountEdit();

    expect(wrapper.get('.md-list-item').classes()).not.toContain('md-state_dragged');
  });

  it('emits clickView with the row id when the primary action is activated', async () => {
    const wrapper = mountEdit();

    await wrapper.get('.md-list-item__primary-action').trigger('click');

    expect(wrapper.emitted('clickView')).toEqual([[FAKE_VIEW_ID]]);
  });

  it('wraps trailing action slot content in a reorder-ignore host element', () => {
    const wrapper = mountEdit({
      trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Edit'),
    });

    const trailingButton = wrapper.find('[data-testid="trailing-btn"]');
    expect(trailingButton.exists()).toBe(true);
    expect(trailingButton.element.parentElement?.tagName).toBe('SPAN');
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
    const wrapper = mountEdit({}, { currentViewId: FAKE_VIEW_ID });

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBe('true');
  });

  it('does not set aria-current when the view is not the current one', () => {
    const wrapper = mountEdit();

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBeUndefined();
  });
});
