import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DiagnosticsErrorPrompt from './DiagnosticsErrorPrompt.vue';

const enableDiagnostics = vi.fn();
const dismiss = vi.fn();

vi.mock('./useDiagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPrompt: () => ({ enableDiagnostics, dismiss }),
}));

describe('DiagnosticsErrorPrompt', () => {
  afterEach(() => {
    enableDiagnostics.mockReset();
    dismiss.mockReset();
  });

  it('renders the contextual prompt copy and actions', () => {
    const wrapper = mount(DiagnosticsErrorPrompt);

    expect(wrapper.text()).toContain('Help fix this problem?');
    expect(wrapper.text()).toContain(
      'Enable diagnostics to send technical error reports. Your documents and file paths are not sent.',
    );
    expect(wrapper.text()).toContain('Enable diagnostics');
    expect(wrapper.text()).toContain('Not now');
  });

  it('calls enableDiagnostics when the primary action is clicked', async () => {
    const wrapper = mount(DiagnosticsErrorPrompt);

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Enable diagnostics')
      ?.trigger('click');

    expect(enableDiagnostics).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('calls dismiss when the secondary action is clicked', async () => {
    const wrapper = mount(DiagnosticsErrorPrompt);

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Not now')
      ?.trigger('click');

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(enableDiagnostics).not.toHaveBeenCalled();
  });
});
