import { mount } from '@vue/test-utils';
import { computed, defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import MDFabContainer from './MDFabContainer.vue';

vi.mock('@shared/ui/Overlay', () => ({
  useOverlayContainer: () => ref(document.body),
}));

vi.mock('@shared/lib/teleportContainer', () => ({
  TeleportContainer: defineComponent({
    name: 'TeleportContainerStub',
    setup(_props, { slots }) {
      return () => slots.default?.();
    },
  }),
}));

vi.mock('@shared/ui/AriaHidden', () => ({
  useMainContentAriaHidden: () => computed(() => false),
}));

vi.mock('@floating-ui/vue', () => ({
  autoUpdate: vi.fn(),
  offset: vi.fn(),
  shift: vi.fn(),
  useFloating: () => ({
    floatingStyles: computed(() => ({})),
  }),
}));

describe('MDFabContainer', () => {
  it('renders the root and floating surface with BEM classes', () => {
    const wrapper = mount(MDFabContainer, {
      slots: {
        default: h('button', { type: 'button' }, 'Add document'),
      },
    });

    expect(wrapper.classes()).toContain('md-fab-container');
    expect(wrapper.classes()).toContain('md-fab-container__placeholder');
    expect(wrapper.find('.md-fab-container__surface').exists()).toBe(true);
    expect(wrapper.find('.md-fab-container__surface button').text()).toBe('Add document');
  });

  it('keeps the placeholder and floating surface as separate BEM classes', () => {
    const wrapper = mount(MDFabContainer, {
      slots: {
        default: h('button', { type: 'button' }, 'Add document'),
      },
    });

    expect(wrapper.classes()).not.toContain('md-fab-container__surface');
    expect(wrapper.find('.md-fab-container__surface').classes()).toContain(
      'md-fab-container__surface',
    );
  });

  it('uses a BEM auto-hide modifier when auto-hide is enabled', () => {
    const wrapper = mount(MDFabContainer, {
      props: {
        autoHide: true,
      },
      slots: {
        default: h('button', { type: 'button' }, 'Add document'),
      },
      global: {
        stubs: {
          Transition: false,
        },
      },
    });

    expect(wrapper.find('.md-fab-container__surface').classes()).toContain(
      'md-fab-container__surface_auto-hide',
    );
  });
});
