import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toValue, type MaybeRefOrGetter } from 'vue';
import DiagnosticsErrorPrompt from './DiagnosticsErrorPrompt.vue';

const enableDiagnostics = vi.fn();
const dismiss = vi.fn();
const useDiagnosticsErrorPromptMock = vi.fn(
  (_placementSource: MaybeRefOrGetter<'inline' | 'home'>) => ({
    enableDiagnostics,
    dismiss,
  }),
);

vi.mock('./useDiagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPrompt: (placementSource: MaybeRefOrGetter<'inline' | 'home'>) =>
    useDiagnosticsErrorPromptMock(placementSource),
}));

const getCalledPlacement = () => {
  const [placementSource] = useDiagnosticsErrorPromptMock.mock.calls.at(-1) ?? [];
  return placementSource === undefined ? undefined : toValue(placementSource);
};

describe('DiagnosticsErrorPrompt', () => {
  afterEach(() => {
    enableDiagnostics.mockReset();
    dismiss.mockReset();
    useDiagnosticsErrorPromptMock.mockClear();
  });

  it('renders the inline placement copy and actions', () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { placement: 'inline' } });

    expect(getCalledPlacement()).toBe('inline');
    expect(wrapper.text()).toContain('Help fix this problem?');
    expect(wrapper.text()).toContain(
      'Enable diagnostics to send technical error reports. Your documents and file paths are not sent.',
    );
    expect(wrapper.text()).toContain('Enable diagnostics');
    expect(wrapper.text()).toContain('Not now');
  });

  it('renders the home placement copy and actions', () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { placement: 'home' } });

    expect(getCalledPlacement()).toBe('home');
    expect(wrapper.text()).toContain('Help fix recent problems?');
    expect(wrapper.text()).toContain(
      'Enable diagnostics to send technical error reports when something breaks. Your documents, file names, folder paths and document IDs are not sent.',
    );
  });

  it('calls enableDiagnostics when the primary action is clicked', async () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { placement: 'inline' } });

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Enable diagnostics')
      ?.trigger('click');

    expect(enableDiagnostics).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('calls dismiss when the secondary action is clicked', async () => {
    const wrapper = mount(DiagnosticsErrorPrompt, { props: { placement: 'inline' } });

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Not now')
      ?.trigger('click');

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(enableDiagnostics).not.toHaveBeenCalled();
  });
});
