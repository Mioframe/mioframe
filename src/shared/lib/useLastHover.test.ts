import { afterEach, describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { shouldTrackLastHoverPointerType, useLastHover } from './useLastHover';

const flushHoverUpdates = async () => {
  await nextTick();
  await nextTick();
};

const dispatchPointerEvent = (
  type: string,
  target: EventTarget,
  pointerType: string,
  currentTarget: EventTarget = target,
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'pointerType', {
    value: pointerType,
    configurable: true,
  });
  Object.defineProperty(event, 'currentTarget', {
    value: currentTarget,
    configurable: true,
  });

  target.dispatchEvent(event);
};

const mountUseLastHover = (el: HTMLElement) => {
  const scope = effectScope();
  const elRef = ref<HTMLElement | undefined>(el);
  let state!: ReturnType<typeof useLastHover>;

  scope.run(() => {
    state = useLastHover(elRef);
  });

  return {
    elRef,
    scope,
    state,
  };
};

afterEach(() => {
  document.dispatchEvent(new Event('touchstart', { bubbles: true }));
  document.body.innerHTML = '';
});

describe('shouldTrackLastHoverPointerType', () => {
  it('ignores touch pointers for hover state', () => {
    expect(shouldTrackLastHoverPointerType('touch')).toBe(false);
  });

  it('keeps mouse and pen hover tracking enabled', () => {
    expect(shouldTrackLastHoverPointerType('mouse')).toBe(true);
    expect(shouldTrackLastHoverPointerType('pen')).toBe(true);
    expect(shouldTrackLastHoverPointerType(undefined)).toBe(true);
  });
});

describe('useLastHover', () => {
  it('tracks mouse hover for the current element and clears it on leave', async () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    const { scope, state } = mountUseLastHover(el);

    dispatchPointerEvent('pointerenter', el, 'mouse');
    await flushHoverUpdates();

    expect(state.value).toBe(true);

    dispatchPointerEvent('pointerleave', el, 'mouse');
    await flushHoverUpdates();

    expect(state.value).toBe(false);

    scope.stop();
  });

  it('ignores touch pointer hover events', async () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    const { scope, state } = mountUseLastHover(el);

    dispatchPointerEvent('pointerenter', el, 'touch');
    await flushHoverUpdates();

    expect(state.value).toBe(false);

    scope.stop();
  });

  it('shares global state and keeps only the last hovered element active', async () => {
    const first = document.createElement('button');
    const second = document.createElement('button');
    document.body.append(first, second);
    const firstHover = mountUseLastHover(first);
    const secondHover = mountUseLastHover(second);

    dispatchPointerEvent('pointerenter', first, 'mouse');
    await flushHoverUpdates();
    expect(firstHover.state.value).toBe(true);
    expect(secondHover.state.value).toBe(false);

    dispatchPointerEvent('pointerenter', second, 'mouse');
    await flushHoverUpdates();
    expect(firstHover.state.value).toBe(false);
    expect(secondHover.state.value).toBe(true);

    secondHover.scope.stop();
    firstHover.scope.stop();
  });

  it('clears the shared hover state on touch-like global interactions', async () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    const { scope, state } = mountUseLastHover(el);

    dispatchPointerEvent('pointerenter', el, 'mouse');
    await flushHoverUpdates();
    expect(state.value).toBe(true);

    dispatchPointerEvent('pointerdown', document, 'touch', document);
    await flushHoverUpdates();
    expect(state.value).toBe(false);

    dispatchPointerEvent('pointerenter', el, 'mouse');
    await flushHoverUpdates();
    expect(state.value).toBe(true);

    document.dispatchEvent(new Event('dragstart', { bubbles: true }));
    await flushHoverUpdates();
    expect(state.value).toBe(false);

    scope.stop();
  });

  it('removes the previous element when the tracked ref changes', async () => {
    const first = document.createElement('button');
    const second = document.createElement('button');
    document.body.append(first, second);
    const { elRef, scope, state } = mountUseLastHover(first);

    dispatchPointerEvent('pointerenter', first, 'mouse');
    await flushHoverUpdates();
    expect(state.value).toBe(true);

    elRef.value = second;
    await flushHoverUpdates();

    expect(state.value).toBe(false);

    dispatchPointerEvent('pointerenter', second, 'mouse');
    await flushHoverUpdates();

    expect(state.value).toBe(true);

    scope.stop();
  });
});
