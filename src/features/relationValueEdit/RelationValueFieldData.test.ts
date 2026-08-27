/* eslint-disable vue/one-component-per-file -- Focused contract test with boundary stubs. */
import { zodDocumentId } from '@shared/lib/automerge';
import { generateItemId, generateViewId } from '@shared/lib/databaseDocument';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

const propertiesIdList = ref<readonly string[] | undefined>();
const isLoading = ref(true);
const documentId = zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu');
const viewId = generateViewId();
const itemId = generateItemId();

vi.mock('@entity/databaseData', () => ({
  DatabaseDataTable: defineComponent({
    name: 'DatabaseDataTableStub',
    setup(_, { slots }) {
      const renderAction = () => {
        if (!slots.action) return undefined;
        return slots.action({ itemId });
      };

      return () => h('div', { 'data-testid': 'database-data-table' }, [renderAction()]);
    },
  }),
}));

vi.mock('@entity/databaseProperty', () => ({
  DatabasePropertyBlock: defineComponent({ name: 'DatabasePropertyBlockStub' }),
  useDatabaseProperties: () => ({ propertiesIdList, isLoading }),
}));

vi.mock('@shared/ui/material', () => ({
  MDCheckbox: defineComponent({
    name: 'MDCheckboxStub',
    props: { checked: { type: Boolean, required: true } },
    emits: ['update:checked'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-testid': 'relation-checkbox',
          onClick: () => {
            emit('update:checked', !props.checked);
          },
        });
    },
  }),
}));

vi.mock('@shared/ui/ProgressIndicators', () => ({
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',
    setup() {
      return () => h('div', { 'data-testid': 'properties-loading' });
    },
  }),
}));

const mountField = async () => {
  const { default: RelationValueFieldData } = await import('./RelationValueFieldData.vue');

  return mount(RelationValueFieldData, {
    props: {
      directoryPath: '/database',
      documentId,
      selectedValue: [],
      viewId,
      scrollRoot: null,
    },
  });
};

describe('RelationValueFieldData', () => {
  it('keeps the table unmounted while properties are loading', async () => {
    propertiesIdList.value = undefined;
    isLoading.value = true;

    const wrapper = await mountField();

    expect(wrapper.get('[data-testid="properties-loading"]')).toBeTruthy();
    expect(wrapper.find('[data-testid="database-data-table"]').exists()).toBe(false);
  });

  it('mounts the table once the loading-only state is false', async () => {
    propertiesIdList.value = undefined;
    isLoading.value = true;
    const wrapper = await mountField();

    propertiesIdList.value = ['property-1'];
    isLoading.value = false;
    await nextTick();

    expect(wrapper.find('[data-testid="properties-loading"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="database-data-table"]')).toBeTruthy();
  });

  it('emits the selected item id once for one checkbox interaction', async () => {
    propertiesIdList.value = ['property-1'];
    isLoading.value = false;

    const wrapper = await mountField();

    await wrapper.get('[data-testid="relation-checkbox"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([[itemId]]);
  });
});

/* eslint-enable vue/one-component-per-file -- End boundary-stub contract file. */
