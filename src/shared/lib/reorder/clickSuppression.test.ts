import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClickSuppression } from './clickSuppression';

const dispatchClick = (el: HTMLElement): boolean =>
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('createClickSuppression', () => {
  it('suppresses exactly the next click on the armed container, then lets later clicks through', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.arm(container);

    expect(dispatchClick(container)).toBe(false);
    expect(dispatchClick(container)).toBe(true);
  });

  it('removes suppression via the bounded fallback when no click is ever generated', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.arm(container);
    vi.runAllTimers();

    expect(dispatchClick(container)).toBe(true);
  });

  it('re-arming for a new gesture clears any previously armed suppression', () => {
    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    document.body.append(containerA, containerB);
    const suppression = createClickSuppression();

    suppression.arm(containerA);
    suppression.arm(containerB);

    expect(dispatchClick(containerA)).toBe(true);
    expect(dispatchClick(containerB)).toBe(false);
  });

  it('disarm clears pending suppression immediately', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.arm(container);
    suppression.disarm();

    expect(dispatchClick(container)).toBe(true);
  });

  it('a suppressed click also stops propagation past the container', () => {
    const parent = document.createElement('div');
    const container = document.createElement('div');
    parent.append(container);
    document.body.append(parent);
    const suppression = createClickSuppression();
    let bubbledToParent = false;
    parent.addEventListener('click', () => {
      bubbledToParent = true;
    });

    suppression.arm(container);
    dispatchClick(container);

    expect(bubbledToParent).toBe(false);
  });
});

const dispatchWindowPointer = (type: string, pointerId: number): void => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: pointerId, configurable: true });
  window.dispatchEvent(event);
};

const dispatchSelectStart = (): boolean =>
  document.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true }));

describe('createClickSuppression release watcher', () => {
  it('does not arm immediate suppression when only a release watcher is started', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.armReleaseWatcher({ containerEl: container, pointerId: 1 });

    expect(dispatchClick(container)).toBe(true);

    // Never released within this test; disarm explicitly so its pending watcher/guard don't leak
    // into a later test.
    suppression.disarm();
  });

  it('arms suppression once the original pointer physically releases, even long after cancellation', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.armReleaseWatcher({ containerEl: container, pointerId: 7 });

    // Well past a single zero-delay timer turn: proves the watcher, not a fallback timer, is
    // what's carrying suppression across this gap.
    vi.advanceTimersByTime(2000);
    expect(dispatchClick(container)).toBe(true);

    dispatchWindowPointer('pointerup', 7);

    expect(dispatchClick(container)).toBe(false);
    expect(dispatchClick(container)).toBe(true);
  });

  it('ignores a pointerup for a different pointer id', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.armReleaseWatcher({ containerEl: container, pointerId: 7 });
    dispatchWindowPointer('pointerup', 99);

    expect(dispatchClick(container)).toBe(true);

    // The mismatched pointerup was ignored, so the watcher/guard are still pending; disarm
    // explicitly so they don't leak into a later test.
    suppression.disarm();
  });

  it('a matching pointercancel removes the watcher without arming suppression', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.armReleaseWatcher({ containerEl: container, pointerId: 7 });
    dispatchWindowPointer('pointercancel', 7);

    expect(dispatchClick(container)).toBe(true);

    // The watcher is gone: a later matching pointerup must not retroactively arm suppression.
    dispatchWindowPointer('pointerup', 7);
    expect(dispatchClick(container)).toBe(true);
  });

  it('the bounded safety timeout cleans up the watcher if the pointer never releases', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.armReleaseWatcher({ containerEl: container, pointerId: 7 });
    vi.runAllTimers();

    dispatchWindowPointer('pointerup', 7);
    expect(dispatchClick(container)).toBe(true);
  });

  it('disarm cancels a pending release watcher', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    suppression.armReleaseWatcher({ containerEl: container, pointerId: 7 });
    suppression.disarm();

    dispatchWindowPointer('pointerup', 7);
    expect(dispatchClick(container)).toBe(true);
  });

  it('re-arming immediate suppression clears any previously pending release watcher', () => {
    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    document.body.append(containerA, containerB);
    const suppression = createClickSuppression();

    suppression.armReleaseWatcher({ containerEl: containerA, pointerId: 7 });
    suppression.arm(containerB);

    dispatchWindowPointer('pointerup', 7);
    expect(dispatchClick(containerA)).toBe(true);
    expect(dispatchClick(containerB)).toBe(false);
  });
});

describe('createClickSuppression selectstart', () => {
  // A causal Playwright A/B investigation disproved the "Chromium native text-selection
  // autoscroll" theory an earlier version of this module relied on to justify re-installing a
  // `selectstart`-prevention guard for the bounded release-watcher window; see the module-level
  // doc comment. This regression guards against silently reintroducing that guard without new
  // causal evidence.
  it('never prevents selectstart, with or without a pending release watcher', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const suppression = createClickSuppression();

    expect(dispatchSelectStart()).toBe(true);

    suppression.armReleaseWatcher({ containerEl: container, pointerId: 7 });
    expect(dispatchSelectStart()).toBe(true);

    suppression.disarm();
  });
});
