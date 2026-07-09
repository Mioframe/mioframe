import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { generatePropertyId, generateViewId } from '@shared/lib/databaseDocument';
import DatabaseItemSortingListSection from './DatabaseItemSortingListSection.vue';

const FAKE_PROPERTY_ID = generatePropertyId();
const OTHER_PROPERTY_ID = generatePropertyId();
const FAKE_VIEW_ID = generateViewId();
const FAKE_DOC_ID = new Repo().create({}).documentId;
const INVALID_ID = 'not-a-database-property-id';

const reorderSortingMock = vi.fn();
let sortingIdListState: string[] | undefined = [FAKE_PROPERTY_ID];

vi.mock('@entity/databaseSorting', () => ({
  useDatabaseSorting: () => ({
    sortingIdList: ref(sortingIdListState),
    errorMessage: ref(undefined),
    isLoading: ref(false),
    reorder: reorderSortingMock,
    post: vi.fn(),
    patch: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock('@entity/databaseSorting/useDatabaseSortDescription', () => ({
  useDatabaseSortDescription: () => ({
    sortDescription: ref(undefined),
    toggleDirection: vi.fn(),
  }),
}));

vi.mock('@entity/databaseProperty', () => ({
  useDatabaseProperties: () => ({ propertiesIdList: ref(sortingIdListState ?? []) }),
  useDatabaseProperty: () => ({ property: ref({ name: 'My Property' }) }),
}));

interface MockedReorderSurfaceOptions {
  itemIdList: { value: string[] | undefined };
  onCommit: (payload: { orderedIds: string[] }) => unknown;
}

const { useReorderSurfaceMock } = vi.hoisted(() => ({
  useReorderSurfaceMock: vi.fn((_container: unknown, _options: unknown) => ({
    activeProfile: ref({ input: 'mouse' }),
    displayItemIdList: ref<string[]>(sortingIdListState ?? []),
    draggedId: ref<string | undefined>(undefined),
    isDragging: ref(false),
  })),
}));

vi.mock('@shared/lib/sortable', () => ({
  useReorderSurface: useReorderSurfaceMock,
  vReorderIgnore: {
    mounted(el: HTMLElement) {
      el.setAttribute('data-reorder-ignore', '');
    },
    updated() {},
    unmounted() {},
  },
  vReorderItem: { mounted() {}, updated() {}, unmounted() {} },
}));

const mountSection = () =>
  mount(DatabaseItemSortingListSection, {
    attachTo: document.body,
    props: {
      path: '/db',
      documentId: FAKE_DOC_ID,
      viewId: FAKE_VIEW_ID,
    },
  });

const getMockedOptions = (callIndex = 0): MockedReorderSurfaceOptions =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrows the mock's untyped captured call args to the shape the component actually passes
  useReorderSurfaceMock.mock.calls[callIndex]?.[1] as MockedReorderSurfaceOptions;

describe('DatabaseItemSortingListSection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    useReorderSurfaceMock.mockClear();
    reorderSortingMock.mockClear();
    sortingIdListState = [FAKE_PROPERTY_ID];
  });

  it('configures full-row native activation with explicit-ignore-only interactive strategy', () => {
    mountSection();

    expect(useReorderSurfaceMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        activation: 'fullRowNative',
        interactiveStrategy: 'explicitIgnoreOnly',
      }),
    );
  });

  it('derives itemIdList from the current sorting id list', () => {
    sortingIdListState = [FAKE_PROPERTY_ID, OTHER_PROPERTY_ID];

    mountSection();

    expect(getMockedOptions().itemIdList.value).toEqual([FAKE_PROPERTY_ID, OTHER_PROPERTY_ID]);
  });

  it('commits a reorder through the entity when every id is a valid database property id', () => {
    sortingIdListState = [FAKE_PROPERTY_ID, OTHER_PROPERTY_ID];
    mountSection();

    getMockedOptions().onCommit({ orderedIds: [OTHER_PROPERTY_ID, FAKE_PROPERTY_ID] });

    expect(reorderSortingMock).toHaveBeenCalledWith([OTHER_PROPERTY_ID, FAKE_PROPERTY_ID]);
  });

  it('does not commit a reorder when any id fails database property id validation', () => {
    mountSection();

    getMockedOptions().onCommit({ orderedIds: [FAKE_PROPERTY_ID, INVALID_ID] });

    expect(reorderSortingMock).not.toHaveBeenCalled();
  });

  it('keeps the delete trailing action inside an explicit reorder-ignore zone', () => {
    const wrapper = mountSection();

    const deleteButton = wrapper.get('.md-list-item .md-icon-button');
    expect(deleteButton.attributes('data-reorder-ignore')).toBeDefined();
  });
});
