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
