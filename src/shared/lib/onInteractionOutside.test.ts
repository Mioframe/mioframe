import { defineComponent, nextTick, ref, type Ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onInteractionOutside } from './onInteractionOutside';

describe('onInteractionOutside', () => {
  const wrappers: VueWrapper[] = [];
  const elements: HTMLElement[] = [];

  const mountElement = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    elements.push(el);
    return el;
  };

  // Mounts a real component so `onInteractionOutside`'s internal
  // provide/inject (via useChildTeleportContainerStack) runs inside a valid
  // Vue setup context instead of a bare effect scope, and unmounting stops
  // the component's own effect scope for cleanup.
  const runInComponent = (
    targetRef: Ref<HTMLElement | undefined>,
    callback: (event: Event) => unknown,
    options?: Parameters<typeof onInteractionOutside>[2],
  ) => {
    const wrapper = mount(
      defineComponent({
        setup() {
          onInteractionOutside(targetRef, callback, options);
          return () => null;
        },
      }),
    );
    wrappers.push(wrapper);
  };

  const dispatchClick = (el: HTMLElement) => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => {
      wrapper.unmount();
    });
    elements.splice(0).forEach((el) => {
      el.remove();
    });
    vi.useRealTimers();
  });

  it('never calls the callback for a click retained past a target replacement, even after the old throttle window would have elapsed', async () => {
    vi.useFakeTimers();

    const originalTarget = mountElement();
    const originalChild = document.createElement('button');
    originalTarget.appendChild(originalChild);

    const replacementTarget = mountElement();

    const targetRef = ref<HTMLElement>(originalTarget);
    const callback = vi.fn();

    runInComponent(targetRef, callback, { events: ['click'] });

    dispatchClick(originalChild);
    dispatchClick(originalChild);

    targetRef.value = replacementTarget;
    await nextTick();

    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('synchronously invokes the callback for a current outside event', () => {
    const target = mountElement();
    const outside = mountElement();
    const targetRef = ref<HTMLElement>(target);
    const callback = vi.fn();

    runInComponent(targetRef, callback, { events: ['click'] });

    dispatchClick(outside);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the callback for an inside event', () => {
    const target = mountElement();
    const child = document.createElement('button');
    target.appendChild(child);
    const targetRef = ref<HTMLElement>(target);
    const callback = vi.fn();

    runInComponent(targetRef, callback, { events: ['click'] });

    dispatchClick(child);

    expect(callback).not.toHaveBeenCalled();
  });

  it('treats an ignored element as inside', () => {
    const target = mountElement();
    const ignored = mountElement();
    const targetRef = ref<HTMLElement>(target);
    const ignoredRef = ref<HTMLElement>(ignored);
    const callback = vi.fn();

    runInComponent(targetRef, callback, {
      events: ['click'],
      ignore: [ignoredRef],
    });

    dispatchClick(ignored);

    expect(callback).not.toHaveBeenCalled();
  });
});
