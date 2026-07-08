/* eslint-disable vue/one-component-per-file -- Focused dialog contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import ExportZipProgressSheet from './ExportZipProgressSheet.vue';

vi.mock('@shared/ui/Dialog', () => ({
  MDDialog: defineComponent({
    name: 'MDDialogStub',
    props: {
      headline: { type: String, required: true },
      supportingText: { type: String, required: true },
      applyLabel: { type: String, required: true },
      hasCancelAction: { type: Boolean, default: false },
      loading: { type: [Boolean, Number], default: false },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-headline': props.headline,
            'data-supporting-text': props.supportingText,
            'data-apply-label': props.applyLabel,
            'data-has-cancel-action': props.hasCancelAction,
            'data-loading': props.loading,
          },
          slots.default?.(),
        );
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
  it('renders through MDDialog as a non-cancellable loading dialog', () => {
    const wrapper = mount(ExportZipProgressSheet);

    const dialog = wrapper.find('[data-headline]');
    expect(dialog.attributes('data-headline')).toBe('Exporting ZIP archive');
    expect(dialog.attributes('data-supporting-text')).toBe('Preparing export…');
    expect(dialog.attributes('data-has-cancel-action')).toBe('false');
    expect(dialog.attributes('data-loading')).toBe('true');
  });

  it('passes the current phase as supporting text and count in the body slot', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'reading', current: 2, total: 5 } },
    });

    expect(wrapper.find('[data-headline]').attributes('data-supporting-text')).toBe(
      'Reading files…',
    );
    expect(wrapper.text()).toContain('2 / 5');
    expect(wrapper.find('[data-progress]').attributes('data-progress')).toBe('0.4');
  });

  it('shows the saving phase label', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'saving' } },
    });

    expect(wrapper.find('[data-headline]').attributes('data-supporting-text')).toBe(
      'Saving archive…',
    );
  });

  it('does not emit apply or cancel on its own', () => {
    const wrapper = mount(ExportZipProgressSheet);

    expect(wrapper.emitted()).toEqual({});
  });

  it('uses the shared Material type-scale class for the count text', () => {
    const wrapper = mount(ExportZipProgressSheet, {
      props: { progress: { phase: 'reading', current: 1, total: 2 } },
    });

    expect(wrapper.find('.export-zip-progress-sheet__count').classes()).toContain(
      'md-typescale-body-medium',
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
