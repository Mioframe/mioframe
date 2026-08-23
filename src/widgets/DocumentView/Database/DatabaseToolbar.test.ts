/* eslint-disable vue/one-component-per-file -- This test file defines focused child stubs. */
import { mount } from '@vue/test-utils';
import { zodDocumentId } from '@shared/lib/automerge';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import DatabaseToolbar from './DatabaseToolbar.vue';
import type { DatabaseConfigurationSurface } from './databaseConfigurationSurface';

vi.mock('@entity/databaseView', () => ({
  useDatabaseViewSelection: () => ({
    effectiveViewId: ref('view-id'),
    explicitViewId: ref(),
  }),
}));

vi.mock('@entity/databaseProperty', () => ({
  useDatabaseProperties: () => ({
    patch: vi.fn(),
    size: ref(1),
  }),
}));

const MDIconButtonStub = defineComponent({
  props: {
    tooltip: {
      required: true,
      type: String,
    },
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'aria-label': props.tooltip,
          type: 'button',
          onClick: () => {
            emit('click');
          },
        },
        props.tooltip,
      );
  },
});

const MDToolbarContainerStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const createConfigurationSheetStub = (name: string, testId: string) =>
  defineComponent({
    name,
    emits: ['closed'],
    setup(_props, { emit, slots }) {
      return () =>
        h('div', { 'data-testid': testId }, [
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('closed');
              },
            },
            'close',
          ),
          slots.default?.(),
        ]);
    },
  });

/* eslint-enable vue/one-component-per-file -- Child stubs end here. */

const mountDatabaseToolbar = () =>
  mount(DatabaseToolbar, {
    props: {
      directoryPath: '/database',
      documentId: zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu'),
    },
    global: {
      stubs: {
        DatabaseFiltersSheet: createConfigurationSheetStub('DatabaseFiltersSheet', 'filters-sheet'),
        DatabasePropertiesSheet: createConfigurationSheetStub(
          'DatabasePropertiesSheet',
          'properties-sheet',
        ),
        DatabasePropertyValueFieldById: true,
        DatabaseSortSheet: createConfigurationSheetStub('DatabaseSortSheet', 'sort-sheet'),
        DatabaseViewsSheet: createConfigurationSheetStub('DatabaseViewsSheet', 'views-sheet'),
        DbItemAddDialog: true,
        MDIconButton: MDIconButtonStub,
        MDToolbarContainer: MDToolbarContainerStub,
      },
    },
  });

describe('DatabaseToolbar', () => {
  it('emits configuration intents without opening sheets and renders only controlled state', async () => {
    const wrapper = mountDatabaseToolbar();
    const requests: DatabaseConfigurationSurface[] = ['views', 'sort', 'filter', 'properties'];
    const controls = ['view settings', 'sort', 'filter', 'configure properties'];

    for (const [index, controlName] of controls.entries()) {
      // eslint-disable-next-line no-await-in-loop -- Each control must emit its own request intent.
      await wrapper.get(`button[aria-label="${controlName}"]`).trigger('click');
      expect(wrapper.emitted('requestConfiguration')?.at(-1)).toEqual([requests[index]]);
    }

    expect(wrapper.find('[data-testid="views-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="sort-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="filters-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="properties-sheet"]').exists()).toBe(false);

    await wrapper.setProps({ activeConfigurationSurface: 'filter' });
    expect(wrapper.find('[data-testid="filters-sheet"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="views-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="sort-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="properties-sheet"]').exists()).toBe(false);

    await wrapper.get('[data-testid="filters-sheet"] button').trigger('click');
    expect(wrapper.emitted('closeConfiguration')).toHaveLength(1);
  });
});
