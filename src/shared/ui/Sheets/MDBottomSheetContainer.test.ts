import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MDBottomSheetContainer from './MDBottomSheetContainer.vue';
import MDBottomSheetContainer2 from './MDBottomSheetContainer2.vue';

vi.mock('@shared/lib/scrollTo', async () => {
  const { reactive, readonly } = await import('vue');

  return {
    // Mirrors the real contract: `position` is a readonly reactive object,
    // so it stays a valid `watch` source inside the component.
    useScroll: () => ({
      position: readonly(reactive({ scrollLeft: 0, scrollTop: 0 })),
      scrollTo: vi.fn(() => Promise.resolve(undefined)),
    }),
  };
});

vi.mock('../AriaHidden', () => ({
  useModalAriaHidden: () => 'false',
}));

vi.mock('../Layout', () => ({
  usePaneScrollContainer: () => undefined,
}));

vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}));

vi.mock('@shared/lib/useOnEscapeKeyStacked', () => ({
  useOnEscapeKeyStackedWhen: vi.fn(),
}));

vi.mock('@shared/lib/onBackNavigation', () => ({
  useOnBackNavigationStackedWhen: vi.fn(),
}));

describe('MDBottomSheetContainer drag handle accessibility', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('always gives the standard bottom sheet drag handle an accessible name', () => {
    const wrapper = mount(MDBottomSheetContainer, {
      props: {
        dragHandleExpandLabel: 'Expand filters',
        dragHandleCollapseLabel: 'Collapse filters',
      },
      attachTo: document.body,
      slots: {
        default: '<section>Body</section>',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Expand filters');
  });

  it('labels the modal bottom sheet drag handle according to the current action', async () => {
    const wrapper = mount(MDBottomSheetContainer2, {
      props: {
        open: true,
        dragHandleExpandLabel: 'Expand details',
        dragHandleCloseLabel: 'Close details',
      },
      attachTo: document.body,
      slots: {
        default: '<section>Body</section>',
      },
      global: {
        stubs: {
          MDStateLayer: true,
        },
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Close details');

    await wrapper.setProps({ open: false });

    expect(button.attributes('aria-label')).toBe('Expand details');
  });
});
