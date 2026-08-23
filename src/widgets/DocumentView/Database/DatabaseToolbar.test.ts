/* eslint-disable vue/one-component-per-file -- This test file defines focused child stubs. */
import { mount } from '@vue/test-utils';
import { zodDocumentId } from '@shared/lib/automerge';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import DatabaseToolbar from './DatabaseToolbar.vue';
import type { DatabaseConfigurationSurface } from './databaseConfigurationSurface';

const controls = vi.hoisted(() => ({
  propertySize: { value: 1 },
  effectiveViewId: { value: 'view-id' },
  patchProperty: vi.fn(),
}));

vi.mock('@entity/databaseView', () => ({
  useDatabaseViewSelection: () => ({
    effectiveViewId: ref(controls.effectiveViewId.value),
    explicitViewId: ref(),
  }),
}));

vi.mock('@entity/databaseProperty', () => ({
  useDatabaseProperties: () => ({
    patch: controls.patchProperty,
    size: ref(controls.propertySize.value),
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

const AddDialogStub = defineComponent({
  emits: ['added', 'cancel'],
  setup(_props, { emit, slots }) {
    return () =>
      h('div', { 'data-testid': 'add-dialog' }, [
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('added');
            },
          },
          'added',
        ),
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('cancel');
            },
          },
          'cancel',
        ),
        slots.valueField?.({
          update: vi.fn(),
          value: 'new value',
          propertyId: 'property-id',
          index: 0,
        }),
      ]);
  },
});

const ValueFieldStub = defineComponent({
  props: { value: { required: true, type: String } },
  emits: ['update:property'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        'data-testid': 'value-field',
        onClick: () => {
          emit('update:property', { name: props.value });
        },
      });
  },
});

const documentId = zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu');

/* eslint-enable vue/one-component-per-file -- Child stubs end here. */

const mountDatabaseToolbar = (activeConfigurationSurface?: DatabaseConfigurationSurface) =>
  mount(DatabaseToolbar, {
    props: {
      directoryPath: '/database',
      documentId,
      activeConfigurationSurface,
    },
    global: {
      stubs: {
        DatabaseFiltersSheet: createConfigurationSheetStub('DatabaseFiltersSheet', 'filters-sheet'),
        DatabasePropertiesSheet: createConfigurationSheetStub(
          'DatabasePropertiesSheet',
          'properties-sheet',
        ),
        DatabasePropertyValueFieldById: ValueFieldStub,
        DatabaseSortSheet: createConfigurationSheetStub('DatabaseSortSheet', 'sort-sheet'),
        DatabaseViewsSheet: createConfigurationSheetStub('DatabaseViewsSheet', 'views-sheet'),
        DbItemAddDialog: AddDialogStub,
        MDIconButton: MDIconButtonStub,
        MDToolbarContainer: MDToolbarContainerStub,
      },
    },
  });

describe('DatabaseToolbar', () => {
  beforeEach(() => {
    controls.propertySize.value = 1;
    controls.effectiveViewId.value = 'view-id';
    controls.patchProperty.mockReset();
  });

  it('renders all controls when properties exist and emits configuration intents', async () => {
    const wrapper = mountDatabaseToolbar();
    const requests: DatabaseConfigurationSurface[] = ['views', 'sort', 'filter', 'properties'];
    const controlNames = ['view settings', 'sort', 'filter', 'configure properties'];

    for (const [index, controlName] of controlNames.entries()) {
      // eslint-disable-next-line no-await-in-loop -- Each control must emit its own request intent.
      await wrapper.get(`button[aria-label="${controlName}"]`).trigger('click');
      expect(wrapper.emitted('requestConfiguration')?.at(-1)).toEqual([requests[index]]);
    }

    expect(wrapper.find('[data-testid="views-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="sort-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="filters-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="properties-sheet"]').exists()).toBe(false);
  });

  it('keeps only configure-properties available when there are no properties', () => {
    controls.propertySize.value = 0;
    const wrapper = mountDatabaseToolbar();
    expect(wrapper.find('button[aria-label="configure properties"]').exists()).toBe(true);
    for (const controlName of ['view settings', 'sort', 'add item', 'filter']) {
      expect(wrapper.find(`button[aria-label="${controlName}"]`).exists()).toBe(false);
    }
  });

  it.each([
    ['views', 'views-sheet'],
    ['sort', 'sort-sheet'],
    ['filter', 'filters-sheet'],
    ['properties', 'properties-sheet'],
  ] as const)('renders only the controlled %s sheet', async (surface, testId) => {
    const wrapper = mountDatabaseToolbar(surface);
    expect(wrapper.find(`[data-testid="${testId}"]`).exists()).toBe(true);
    for (const otherId of ['views-sheet', 'sort-sheet', 'filters-sheet', 'properties-sheet']) {
      if (otherId !== testId)
        expect(wrapper.find(`[data-testid="${otherId}"]`).exists()).toBe(false);
    }
    await wrapper.get(`[data-testid="${testId}"] button`).trigger('click');
    expect(wrapper.emitted('closeConfiguration')).toHaveLength(1);
  });

  it('owns add-item dialog visibility and forwards property patches', async () => {
    const wrapper = mountDatabaseToolbar();
    expect(wrapper.find('[data-testid="add-dialog"]').exists()).toBe(false);
    await wrapper.get('button[aria-label="add item"]').trigger('click');
    expect(wrapper.find('[data-testid="add-dialog"]').exists()).toBe(true);
    await wrapper.get('[data-testid="value-field"]').trigger('click');
    expect(controls.patchProperty).toHaveBeenCalledWith('/database', documentId, 'property-id', {
      name: 'new value',
    });
    await wrapper.get('[data-testid="add-dialog"] button').trigger('click');
    expect(wrapper.find('[data-testid="add-dialog"]').exists()).toBe(false);
    await wrapper.get('button[aria-label="add item"]').trigger('click');
    await wrapper.get('[data-testid="add-dialog"] button:nth-of-type(2)').trigger('click');
    expect(wrapper.find('[data-testid="add-dialog"]').exists()).toBe(false);
  });
});
