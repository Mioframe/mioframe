/* eslint-disable vue/one-component-per-file -- Focused component contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import ImportZipProgressSheet from './ImportZipProgressSheet.vue';

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

describe('ImportZipProgressSheet', () => {
  it('shows the validating phase label before any progress is reported', () => {
    const wrapper = mount(ImportZipProgressSheet);

    expect(wrapper.text()).toContain('Validating archive…');
  });

  it('shows the current phase label and count for unpacking progress', () => {
    const wrapper = mount(ImportZipProgressSheet, {
      props: { progress: { phase: 'unpacking', current: 3, total: 4 } },
    });

    expect(wrapper.text()).toContain('Writing files…');
    expect(wrapper.text()).toContain('3 / 4');
    expect(wrapper.find('[data-progress]').attributes('data-progress')).toBe('0.75');
  });

  it('shows the checking-conflicts phase label', () => {
    const wrapper = mount(ImportZipProgressSheet, {
      props: { progress: { phase: 'checkingConflicts' } },
    });

    expect(wrapper.text()).toContain('Checking for conflicts…');
  });

  it('emits close when the sheet is dismissed', async () => {
    const wrapper = mount(ImportZipProgressSheet);

    await wrapper.findComponent({ name: 'MDBottomSheetStub' }).vm.$emit('closed');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
