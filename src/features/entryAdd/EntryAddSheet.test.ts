/* eslint-disable vue/one-component-per-file -- Focused component contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import EntryAddSheet from './EntryAddSheet.vue';

vi.mock('@shared/ui/Sheets', () => ({
  MDBottomSheet: defineComponent({
    name: 'MDBottomSheetStub',
    setup(_props, { slots }) {
      return () => slots.default?.();
    },
  }),
  MDBottomSheetSection: defineComponent({
    name: 'MDBottomSheetSectionStub',
    setup(_props, { slots }) {
      return () => slots.default?.();
    },
  }),
}));

vi.mock('@shared/ui/Lists', () => ({
  MDListItem: defineComponent({
    name: 'MDListItemStub',
    props: {
      labelText: {
        type: String,
        required: true,
      },
      supportingText: {
        type: String,
        default: '',
      },
    },
    emits: ['action'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('action');
            },
          },
          [slots.leading?.(), `${props.labelText}|${props.supportingText}`],
        );
    },
  }),
}));

vi.mock('@shared/ui/Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',
    props: {
      name: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      return () => h('span', props.name);
    },
  }),
}));

describe('EntryAddSheet', () => {
  it('renders the add options and emits semantic selection events', async () => {
    const wrapper = mount(EntryAddSheet);

    expect(wrapper.text()).toContain('Create document');
    expect(wrapper.text()).toContain('Import document');
    expect(wrapper.text()).toContain('Create directory');

    const buttons = wrapper.findAll('button');
    await buttons[0]?.trigger('click');
    await buttons[1]?.trigger('click');
    await buttons[2]?.trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(3);
    expect(wrapper.emitted('selectCreateDocument')).toHaveLength(1);
    expect(wrapper.emitted('selectImportDocument')).toHaveLength(1);
    expect(wrapper.emitted('selectCreateDirectory')).toHaveLength(1);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
