/* eslint-disable vue/one-component-per-file -- Focused pane contract test with inline stubs. */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import HomePane from './HomePane.vue';

const { isDiagnosticsHomePromptVisible, enableDiagnosticsMock, dismissMock } = vi.hoisted(() => ({
  isDiagnosticsHomePromptVisible: { value: false },
  enableDiagnosticsMock: vi.fn(),
  dismissMock: vi.fn(),
}));

vi.mock('@shared/ui/Layout', () => ({
  MDPane: defineComponent({
    name: 'MDPaneStub',
    setup(_props, { slots }) {
      return () => h('section', [slots.topBar?.(), slots.default?.()]);
    },
  }),
}));

vi.mock('@shared/ui/AppBar', () => ({
  MDAppBar: defineComponent({
    name: 'MDAppBarStub',
    setup(_props, { slots }) {
      return () => h('header', slots.trailingElements?.());
    },
  }),
}));

vi.mock('@page/routes', () => ({
  useStackNavigation: () => ({ open: vi.fn() }),
}));

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings: ref({ hideStarterWidget: true, googleDriveIntegrationEnabled: false }),
  }),
}));

vi.mock('@feature/pwaInstall', () => ({
  usePwaInstallAction: () => ({ isHomeWidgetVisible: ref(false) }),
}));

vi.mock('@widget/GoogleDriveWidget', () => ({
  GoogleDriveWidget: defineComponent({
    name: 'GoogleDriveWidgetStub',
    setup: () => () => null,
  }),
}));

vi.mock('@widget/LocalFSWidget', () => ({
  LocalFSWidget: defineComponent({
    name: 'LocalFSWidgetStub',
    setup: () => () => h('div', 'local-fs-widget-stub'),
  }),
}));

vi.mock('@widget/StarterExamplesWidget', () => ({
  StarterExamplesWidget: defineComponent({
    name: 'StarterExamplesWidgetStub',
    setup: () => () => null,
  }),
}));

vi.mock('@widget/PwaInstallWidget', () => ({
  PwaInstallWidget: defineComponent({
    name: 'PwaInstallWidgetStub',
    setup: () => () => null,
  }),
}));

vi.mock('@feature/diagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPrompt: (placement: 'inline' | 'home') => {
    expect(placement).toBe('home');
    return {
      isVisible: isDiagnosticsHomePromptVisible.value,
      enableDiagnostics: enableDiagnosticsMock,
      dismiss: dismissMock,
    };
  },
  DiagnosticsErrorPrompt: defineComponent({
    name: 'DiagnosticsErrorPromptStub',
    props: { placement: { type: String, required: true } },
    setup(props) {
      return () => h('div', { 'data-testid': 'diagnostics-home-prompt' }, props.placement);
    },
  }),
}));

const mountHomePane = () => mount(HomePane);

describe('HomePane diagnostics fallback prompt', () => {
  beforeEach(() => {
    isDiagnosticsHomePromptVisible.value = false;
  });

  it('does not render the diagnostics fallback card before a pending Home-placement request', () => {
    const wrapper = mountHomePane();

    expect(wrapper.find('[data-testid="diagnostics-home-prompt"]').exists()).toBe(false);
  });

  it('renders the diagnostics fallback card with the home placement when eligible', () => {
    isDiagnosticsHomePromptVisible.value = true;
    const wrapper = mountHomePane();

    const prompt = wrapper.find('[data-testid="diagnostics-home-prompt"]');
    expect(prompt.exists()).toBe(true);
    expect(prompt.text()).toBe('home');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after the inline stubs used in this test file. */
