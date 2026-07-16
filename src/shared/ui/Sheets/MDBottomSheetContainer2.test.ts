import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, type Ref } from 'vue';
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

vi.mock('@shared/lib/useOnEscapeKeyStacked', () => ({
  useOnEscapeKeyStackedWhen: vi.fn(),
}));

vi.mock('@shared/lib/onBackNavigation', () => ({
  useOnBackNavigationStackedWhen: vi.fn(),
}));

// The real `focus-trap` package determines its focusable/tabbable nodes from rendered layout
// geometry (getClientRects, offsetParent), which happy-dom does not compute, so it cannot run
// in this suite ("Your focus-trap needs to have at least one focusable element"). This fake
// reproduces its two behaviors relevant to the scroll-jump bug this component fixes: focusing
// the container's first focusable element on activation, and re-focusing it when the
// previously focused element is removed from the DOM (the dnd-kit DOM-movement case). Both
// calls forward the real `preventScroll` option the component passes in, so these tests still
// exercise actual `Element.focus()` call arguments rather than only this component's own
// `useFocusTrap` options bag.
let capturedOptions: { preventScroll?: boolean } | undefined;

vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: (target: Ref<HTMLElement | undefined>, options: { preventScroll?: boolean }) => {
    capturedOptions = options;
    let observer: MutationObserver | undefined;

    const focusFirstTabbable = () => {
      const container = target.value;
      const first = container?.querySelector<HTMLElement>('button, a[href], input, [tabindex]');
      first?.focus(options.preventScroll ? { preventScroll: true } : undefined);
    };

    return {
      activate: () => {
        focusFirstTabbable();
        const container = target.value;
        if (container) {
          observer = new MutationObserver(() => {
            // Real focus-trap redirects whenever the active element is no longer inside the
            // trap's own container — removing a focused descendant moves the browser's focus
            // back to <body>, which is still document-connected but outside the trap boundary.
            if (!container.contains(document.activeElement)) {
              focusFirstTabbable();
            }
          });
          observer.observe(container, { childList: true, subtree: true });
        }
      },
      deactivate: () => {
        observer?.disconnect();
      },
    };
  },
}));

const mountSheet = (slotHtml = '<button type="button">row action</button>') =>
  mount(MDBottomSheetContainer2, {
    props: { open: true },
    attachTo: document.body,
    slots: {
      default: slotHtml,
    },
    global: {
      stubs: {
        MDStateLayer: true,
      },
    },
  });

describe('MDBottomSheetContainer2 focus-trap scroll safety', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    capturedOptions = undefined;
    vi.restoreAllMocks();
  });

  it('configures its focus trap with preventScroll: true', async () => {
    const wrapper = mountSheet();
    await nextTick();
    await nextTick();

    expect(capturedOptions?.preventScroll).toBe(true);

    wrapper.unmount();
  });

  it('activates its focus trap without changing the existing sheet scrollTop', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    const wrapper = mountSheet();
    const scrim = wrapper.get('.md-bottom-sheet__scrim').element;
    Object.defineProperty(scrim, 'scrollTop', { value: 42, writable: true, configurable: true });

    await nextTick();
    await nextTick();

    expect(focusSpy).toHaveBeenCalled();
    // Every call the trap makes while activating must carry preventScroll: true — asserting on
    // the real `focus()` call arguments proves the option reaches the browser API, not just
    // that this component passed it into its own `useFocusTrap` options bag.
    for (const call of focusSpy.mock.calls) {
      const [options] = call;
      expect(options?.preventScroll).toBe(true);
    }
    expect(scrim.scrollTop).toBe(42);

    wrapper.unmount();
  });

  it('redirects focus without a preventScroll-less call when the focused row leaves the DOM', async () => {
    const wrapper = mountSheet('<button id="removable" type="button">removable row</button>');
    await nextTick();
    await nextTick();

    const removable = wrapper.find<HTMLButtonElement>('#removable').element;
    // Simulate the row having received focus, matching the real pointerdown-focuses-the-row
    // sequence a reorder drag activates from.
    removable.focus({ preventScroll: true });
    expect(document.activeElement).toBe(removable);

    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    // Simulate dnd-kit-style DOM movement: the previously focused row leaves the document,
    // matching a reorder drag physically relocating the dragged row's DOM node.
    removable.remove();
    // MutationObserver callbacks queue as their own microtask batch; `nextTick()` alone is not
    // guaranteed to flush it in happy-dom, so wait an explicit macrotask turn too.
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(focusSpy).toHaveBeenCalled();
    for (const call of focusSpy.mock.calls) {
      const [options] = call;
      expect(options?.preventScroll).toBe(true);
    }

    wrapper.unmount();
  });

  it('keeps opening and closing behavior intact with the trap configured', async () => {
    const wrapper = mountSheet();
    await nextTick();
    await nextTick();

    expect(wrapper.get('.md-bottom-sheet__drag-handle').attributes('aria-label')).toBe(
      'Close sheet',
    );

    await wrapper.setProps({ open: false });
    await nextTick();
    await nextTick();

    expect(wrapper.get('.md-bottom-sheet__drag-handle').attributes('aria-label')).toBe(
      'Expand sheet',
    );

    await wrapper.setProps({ open: true });
    await nextTick();
    await nextTick();

    expect(wrapper.get('.md-bottom-sheet__drag-handle').attributes('aria-label')).toBe(
      'Close sheet',
    );

    wrapper.unmount();
  });

  it('still toggles open state on drag-handle click with the trap configured', async () => {
    const wrapper = mountSheet();
    await nextTick();
    await nextTick();

    await wrapper.get('.md-bottom-sheet__drag-handle').trigger('click');

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);

    wrapper.unmount();
  });
});
