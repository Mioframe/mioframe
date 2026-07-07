/* eslint-disable vue/one-component-per-file -- Focused component contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import ExportZipProgressSheet from './ExportZipProgressSheet.vue';

vi.mock('@shared/ui/Sheets', () => ({
  MDBottomSheet: defineComponent({
    name: 'MDBottomSheetStub',
    props: { label: { type: String, required: true } },
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
  MDBottomSheetSection: defineComponent({
    name: 'MDBottomSheetSectionStub',
    setup(_props, { slots }) {
      return () => h('section', slots.default?.());
    },
  }),
}));

vi.mock('@shared/ui/ProgressIndicators', () => ({
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',
    props: { progress: { type: Number, default: 0 } },
    setup(props) {
      return () => h('div', { 'data-progress': props.progress });
    },
  }),
}));

describe('ExportZipProgressSheet', () => {
  it('shows the preparing phase label before any progress is reported', () => {
    const wrapper = mount(ExportZipProgressSheet);

    expect(wrapper.text()).toContain('Preparing export…');
  });

  it('shows the current phase label and count for reading progress', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'reading', current: 2, total: 5 } },
    });

    expect(wrapper.text()).toContain('Reading files…');
    expect(wrapper.text()).toContain('2 / 5');
    expect(wrapper.find('[data-progress]').attributes('data-progress')).toBe('0.4');
  });

  it('shows the saving phase label', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'saving' } },
    });

    expect(wrapper.text()).toContain('Saving archive…');
  });

  it('emits close when the sheet is dismissed', async () => {
    const wrapper = mount(ExportZipProgressSheet);

    await wrapper.findComponent({ name: 'MDBottomSheetStub' }).vm.$emit('closed');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
