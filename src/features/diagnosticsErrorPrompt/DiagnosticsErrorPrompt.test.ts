import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DiagnosticsErrorPrompt from './DiagnosticsErrorPrompt.vue';

const enableDiagnosticsFromPrompt = vi.fn();
const dismissDiagnosticsPrompt = vi.fn();

vi.mock('./useDiagnosticsErrorPromptEligibility', () => ({
  useDiagnosticsErrorPromptEligibility: () => ({
    enableDiagnosticsFromPrompt,
    dismissDiagnosticsPrompt,
  }),
}));

describe('DiagnosticsErrorPrompt', () => {
  afterEach(() => {
    enableDiagnosticsFromPrompt.mockReset();
    dismissDiagnosticsPrompt.mockReset();
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

    expect(enableDiagnosticsFromPrompt).toHaveBeenCalledTimes(1);
    expect(dismissDiagnosticsPrompt).not.toHaveBeenCalled();
    expect(wrapper.emitted('enabled')).toHaveLength(1);
    expect(wrapper.emitted('dismissed')).toBeUndefined();
  });

  it('calls dismiss and emits dismissed when the secondary action is clicked', async () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { variant: 'inline' } });

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Not now')
      ?.trigger('click');

    expect(dismissDiagnosticsPrompt).toHaveBeenCalledTimes(1);
    expect(enableDiagnosticsFromPrompt).not.toHaveBeenCalled();
    expect(wrapper.emitted('dismissed')).toHaveLength(1);
    expect(wrapper.emitted('enabled')).toBeUndefined();
  });
});
