/* eslint-disable vue/one-component-per-file -- Focused dialog contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import ExportZipDialog from './ExportZipDialog.vue';
import type { ExportZipVisibleDialogState } from './useExportDirectoryZip';

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
    emits: ['apply'],
    setup(props, { slots, emit }) {
      return () =>
        h(
          'div',
          {
            'data-headline': props.headline,
            'data-supporting-text': props.supportingText,
            'data-apply-label': props.applyLabel,
            'data-has-cancel-action': props.hasCancelAction,
            'data-loading': props.loading,
            onClick: () => {
              emit('apply');
            },
          },
          slots.default?.(),
        );
    },
  }),
}));

vi.mock('@shared/ui/material', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/ui/material')>()),
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',
    props: { progress: { type: Number, default: 0 } },
    setup(props) {
      return () => h('div', { 'data-progress': props.progress });
    },
  }),
}));

const mountDialog = (state: ExportZipVisibleDialogState) =>
  mount(ExportZipDialog, { props: { state } });

describe('ExportZipDialog', () => {
  it('renders the running state through MDDialog as a non-cancellable loading dialog', () => {
    const wrapper = mountDialog({ status: 'running' });

    const dialog = wrapper.find('[data-headline]');
    expect(dialog.attributes('data-headline')).toBe('Exporting ZIP archive');
    expect(dialog.attributes('data-supporting-text')).toBe('Preparing export…');
    expect(dialog.attributes('data-has-cancel-action')).toBe('false');
    expect(dialog.attributes('data-loading')).toBe('true');
    expect(dialog.attributes('data-apply-label')).toBe('Done');
  });

  it('passes the current phase as supporting text and count in the body slot', () => {
    const wrapper = mountDialog({
      status: 'running',
      progress: { phase: 'reading', current: 2, total: 5 },
    });

    expect(wrapper.find('[data-headline]').attributes('data-supporting-text')).toBe(
      'Reading files…',
    );
    expect(wrapper.text()).toContain('2 / 5');
    expect(wrapper.find('[data-progress]').attributes('data-progress')).toBe('0.4');
  });

  it('shows the saving phase label', () => {
    const wrapper = mountDialog({ status: 'running', progress: { phase: 'saving' } });

    expect(wrapper.find('[data-headline]').attributes('data-supporting-text')).toBe(
      'Saving archive…',
    );
  });

  it('renders the success state as a non-loading dialog with a Done action and no progress body', () => {
    const wrapper = mountDialog({ status: 'success', message: 'ZIP archive exported.' });

    const dialog = wrapper.find('[data-headline]');
    expect(dialog.attributes('data-headline')).toBe('ZIP archive exported');
    expect(dialog.attributes('data-supporting-text')).toBe('ZIP archive exported.');
    expect(dialog.attributes('data-loading')).toBe('false');
    expect(dialog.attributes('data-apply-label')).toBe('Done');
    expect(wrapper.find('[data-progress]').exists()).toBe(false);
  });

  it('renders the error state as a non-loading dialog with a Close action', () => {
    const wrapper = mountDialog({ status: 'error', message: 'Could not export the ZIP archive' });

    const dialog = wrapper.find('[data-headline]');
    expect(dialog.attributes('data-headline')).toBe('Could not export ZIP archive');
    expect(dialog.attributes('data-supporting-text')).toBe('Could not export the ZIP archive');
    expect(dialog.attributes('data-loading')).toBe('false');
    expect(dialog.attributes('data-apply-label')).toBe('Close');
    expect(wrapper.find('[data-progress]').exists()).toBe(false);
  });

  it('emits close when the dialog applies in a success state', async () => {
    const wrapper = mountDialog({ status: 'success', message: 'ZIP archive exported.' });

    await wrapper.find('[data-headline]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when the dialog applies in an error state', async () => {
    const wrapper = mountDialog({ status: 'error', message: 'Could not export the ZIP archive' });

    await wrapper.find('[data-headline]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('does not emit close on its own while running', () => {
    const wrapper = mountDialog({ status: 'running' });

    expect(wrapper.emitted()).toEqual({});
  });

  it('does not emit close when the dialog applies while running', async () => {
    const wrapper = mountDialog({ status: 'running' });

    await wrapper.find('[data-headline]').trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('uses the shared Material type-scale class for the count text', () => {
    const wrapper = mountDialog({
      status: 'running',
      progress: { phase: 'reading', current: 1, total: 2 },
    });

    expect(wrapper.find('.export-zip-dialog__count').classes()).toContain(
      'md-typescale-body-medium',
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
