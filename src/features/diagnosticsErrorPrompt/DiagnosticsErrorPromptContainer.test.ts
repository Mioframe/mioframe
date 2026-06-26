import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import DiagnosticsErrorPromptContainer from './DiagnosticsErrorPromptContainer.vue';

const isVisible = ref(false);
const enableDiagnostics = vi.fn();
const dismiss = vi.fn();

vi.mock('./useDiagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPrompt: () => ({ isVisible, enableDiagnostics, dismiss }),
}));

vi.mock('@shared/lib/useClosestParentFrame', () => ({
  useClosestParentFrame: () => ref(undefined),
}));

vi.mock('@shared/lib/teleportContainer', () => ({
  TeleportContainer: defineComponent({
    name: 'TeleportContainerStub',
    setup(_props, { slots }) {
      return () => slots.default?.();
    },
  }),
}));

describe('DiagnosticsErrorPromptContainer', () => {
  afterEach(() => {
    isVisible.value = false;
    enableDiagnostics.mockReset();
    dismiss.mockReset();
  });

  it('renders nothing visible when the prompt is not eligible', () => {
    const wrapper = mount(DiagnosticsErrorPromptContainer);

    expect(wrapper.text()).not.toContain('Help fix this problem?');
  });

  it('renders the contextual prompt copy and actions when eligible', () => {
    isVisible.value = true;
    const wrapper = mount(DiagnosticsErrorPromptContainer);

    expect(wrapper.text()).toContain('Help fix this problem?');
    expect(wrapper.text()).toContain(
      'Enable diagnostics to send technical error reports. Your documents and file paths are not sent.',
    );
    expect(wrapper.text()).toContain('Enable diagnostics');
    expect(wrapper.text()).toContain('Not now');
  });

  it('calls enableDiagnostics when the primary action is clicked', async () => {
    isVisible.value = true;
    const wrapper = mount(DiagnosticsErrorPromptContainer);

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Enable diagnostics')
      ?.trigger('click');

    expect(enableDiagnostics).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('calls dismiss when the secondary action is clicked', async () => {
    isVisible.value = true;
    const wrapper = mount(DiagnosticsErrorPromptContainer);

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Not now')
      ?.trigger('click');

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(enableDiagnostics).not.toHaveBeenCalled();
  });
});
