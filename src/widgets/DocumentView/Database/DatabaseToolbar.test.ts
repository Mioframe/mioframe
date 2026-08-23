/* eslint-disable vue/one-component-per-file -- This test file defines focused child stubs. */
import { flushPromises, mount } from '@vue/test-utils';
import { zodDocumentId } from '@shared/lib/automerge';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import DatabaseToolbar from './DatabaseToolbar.vue';

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
    setup() {
      return () => h('div', { 'data-testid': testId });
    },
  });

/* eslint-enable vue/one-component-per-file -- Child stubs end here. */

const mountDatabaseToolbar = (resolveInlineEditBeforeConfiguration: () => Promise<boolean>) =>
  mount(DatabaseToolbar, {
    props: {
      directoryPath: '/database',
      documentId: zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu'),
      resolveInlineEditBeforeConfiguration,
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
  it('does not open source or property-shape configuration after failed edit resolution', async () => {
    const resolveInlineEditBeforeConfiguration = vi.fn().mockResolvedValue(false);
    const wrapper = mountDatabaseToolbar(resolveInlineEditBeforeConfiguration);

    for (const controlName of ['view settings', 'sort', 'filter', 'configure properties']) {
      // eslint-disable-next-line no-await-in-loop -- Each control must independently await the gate.
      await wrapper.get(`button[aria-label="${controlName}"]`).trigger('click');
      // eslint-disable-next-line no-await-in-loop -- The click handler awaits the composition gate.
      await flushPromises();
    }

    expect(resolveInlineEditBeforeConfiguration).toHaveBeenCalledTimes(4);
    expect(wrapper.find('[data-testid="views-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="sort-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="filters-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="properties-sheet"]').exists()).toBe(false);
  });
});
