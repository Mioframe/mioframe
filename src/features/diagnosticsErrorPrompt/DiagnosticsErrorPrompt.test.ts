import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DiagnosticsErrorPrompt from './DiagnosticsErrorPrompt.vue';

const enableDiagnostics = vi.fn();
const dismiss = vi.fn();

vi.mock('./useHomeDiagnosticsErrorPrompt', () => ({
  useHomeDiagnosticsErrorPrompt: () => ({
    enableDiagnostics,
    dismiss,
  }),
}));

describe('DiagnosticsErrorPrompt', () => {
  afterEach(() => {
    enableDiagnostics.mockReset();
    dismiss.mockReset();
  });

  it('renders the inline variant copy and actions', () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { variant: 'inline' } });

    expect(wrapper.text()).toContain('Help fix this problem?');
    expect(wrapper.text()).toContain(
      'Enable diagnostics to send technical error reports. Your documents and file paths are not sent.',
    );
    expect(wrapper.text()).toContain('Enable diagnostics');
    expect(wrapper.text()).toContain('Not now');
  });

  it('renders the home variant copy and actions', () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { variant: 'home' } });

    expect(wrapper.text()).toContain('Help fix recent problems?');
    expect(wrapper.text()).toContain(
      'Enable diagnostics to send technical error reports when something breaks. Your documents, file names, folder paths and document IDs are not sent.',
    );
  });

  it('calls enableDiagnostics and emits enabled when the primary action is clicked', async () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { variant: 'inline' } });

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Enable diagnostics')
      ?.trigger('click');

    expect(enableDiagnostics).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
    expect(wrapper.emitted('enabled')).toHaveLength(1);
    expect(wrapper.emitted('dismissed')).toBeUndefined();
  });

  it('calls dismiss and emits dismissed when the secondary action is clicked', async () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { variant: 'inline' } });

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Not now')
      ?.trigger('click');

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(enableDiagnostics).not.toHaveBeenCalled();
    expect(wrapper.emitted('dismissed')).toHaveLength(1);
    expect(wrapper.emitted('enabled')).toBeUndefined();
  });
});
