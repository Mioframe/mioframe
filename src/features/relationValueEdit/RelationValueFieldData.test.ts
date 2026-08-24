/* eslint-disable vue/one-component-per-file -- Focused contract test with boundary stubs. */
import { zodDocumentId } from '@shared/lib/automerge';
import { generateViewId } from '@shared/lib/databaseDocument';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

const propertiesIdList = ref<readonly string[] | undefined>();
const isLoading = ref(true);
const documentId = zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu');
const viewId = generateViewId();

vi.mock('@entity/databaseData', () => ({
  DatabaseDataTable: defineComponent({
    name: 'DatabaseDataTableStub',
    setup() {
      return () => h('div', { 'data-testid': 'database-data-table' });
    },
  }),
}));

vi.mock('@entity/databaseProperty', () => ({
  DatabasePropertyBlock: defineComponent({ name: 'DatabasePropertyBlockStub' }),
  useDatabaseProperties: () => ({ propertiesIdList, isLoading }),
}));

vi.mock('@shared/ui/material', () => ({
  MDCheckbox: defineComponent({ name: 'MDCheckboxStub' }),
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
      onSelect: vi.fn(),
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
});

/* eslint-enable vue/one-component-per-file -- End boundary-stub contract file. */
