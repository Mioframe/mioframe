import { mount } from '@vue/test-utils';
import { computed, defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import FabContainer from './FabContainer.vue';

vi.mock('@shared/ui/Overlay', () => ({
  useOverlayContainer: () => ref(document.body),
}));

vi.mock('@shared/lib/teleportContainer', () => ({
  TeleportContainer: defineComponent({
    name: 'TeleportContainerStub',
    props: {
      container: { type: Object, default: undefined },
      to: { type: Object, default: undefined },
    },
    setup(_props, { slots }) {
      return () => slots.default?.();
    },
  }),
}));

vi.mock('@shared/ui/AriaHidden', () => ({
  useMainContentAriaHidden: () => computed(() => false),
}));

vi.mock('../Layout', () => ({
  usePaneScrollContainer: () => computed(() => document.body),
}));

vi.mock('@floating-ui/vue', () => ({
  autoUpdate: vi.fn(),
  offset: vi.fn(),
  shift: vi.fn(),
  useFloating: () => ({
    floatingStyles: computed(() => ({})),
  }),
}));

describe('FabContainer', () => {
  it('renders the root and floating surface with BEM classes', () => {
    const wrapper = mount(FabContainer, {
      slots: {
        default: h('button', { type: 'button' }, 'Add document'),
      },
    });

    expect(wrapper.classes()).toContain('fab-container');
    expect(wrapper.classes()).toContain('fab-container__placeholder');
    expect(wrapper.find('.fab-container__surface').exists()).toBe(true);
    expect(wrapper.find('.fab-container__surface button').text()).toBe('Add document');
  });

  it('keeps the placeholder and floating surface as separate BEM classes', () => {
    const wrapper = mount(FabContainer, {
      slots: {
        default: h('button', { type: 'button' }, 'Add document'),
      },
    });

    expect(wrapper.classes()).not.toContain('fab-container__surface');
    expect(wrapper.find('.fab-container__surface').classes()).toContain('fab-container__surface');
  });

  it('uses a BEM auto-hide modifier when auto-hide is enabled', () => {
    const wrapper = mount(FabContainer, {
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

    expect(wrapper.find('.fab-container__surface').classes()).toContain(
      'fab-container__surface_auto-hide',
    );
  });
});
