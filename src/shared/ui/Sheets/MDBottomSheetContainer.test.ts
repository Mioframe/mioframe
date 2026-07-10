import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MDBottomSheetContainer from './MDBottomSheetContainer.vue';
import MDBottomSheetContainer2 from './MDBottomSheetContainer2.vue';

const scrollToMock = vi.hoisted(() => vi.fn(() => Promise.resolve(undefined)));
const mockBodyHeightSetter = vi.hoisted<{ current: (value: number) => void }>(() => ({
  current: () => {},
}));

vi.mock('@shared/lib/scrollTo', async () => {
  const { reactive, readonly } = await import('vue');

  return {
    // Mirrors the real contract: `position` is a readonly reactive object,
    // so it stays a valid `watch` source inside the component.
    useScroll: () => ({
      position: readonly(reactive({ scrollLeft: 0, scrollTop: 0 })),
      scrollTo: scrollToMock,
    }),
  };
});

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');
  const { ref } = await import('vue');
  // Real ResizeObserver-driven measurement never fires in jsdom, so `bodyHeight` would
  // otherwise stay 0 forever. This shared, test-controllable ref lets tests simulate a
  // body resize (e.g. from reactively reordered content) while the sheet stays open.
  const bodyHeight = ref(0);

  mockBodyHeightSetter.current = (value: number) => {
    bodyHeight.value = value;
  };

  return {
    ...actual,
    useElementSize: () => ({ width: ref(0), height: bodyHeight }),
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
    mockBodyHeightSetter.current(0);
  });

  it('scrolls to reveal the body only on the closed-to-open transition, not on every later resize', async () => {
    scrollToMock.mockClear();
    mockBodyHeightSetter.current(0);

    const wrapper = mount(MDBottomSheetContainer2, {
      props: {
        open: false,
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

    mockBodyHeightSetter.current(500);
    await nextTick();
    scrollToMock.mockClear();

    // Opening scrolls the body into view exactly once.
    await wrapper.setProps({ open: true });
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    scrollToMock.mockClear();

    // Regression guard: a `bodyHeight` change while the sheet stays open — as happens
    // when reactively reordered content resizes `bodyEl` — must not hijack the sheet's
    // current scroll position by re-running the open-reveal effect.
    mockBodyHeightSetter.current(700);
    await nextTick();
    expect(scrollToMock).not.toHaveBeenCalled();

    // Closing still resets scroll, and a later reopen still scrolls to reveal again.
    await wrapper.setProps({ open: false });
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0 });
    scrollToMock.mockClear();

    await wrapper.setProps({ open: true });
    expect(scrollToMock).toHaveBeenCalledTimes(1);
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
