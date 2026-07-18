import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attemptTouchHapticFeedback, scheduleTouchDragCleanup } from './touchDragCleanup';

const stubVibrate = (value: typeof navigator.vibrate | undefined) => {
  Object.defineProperty(navigator, 'vibrate', { value, configurable: true });
};

describe('attemptTouchHapticFeedback', () => {
  afterEach(() => {
    stubVibrate(undefined);
  });

  it('attempts vibration for touch activation', () => {
    const vibrate = vi.fn();
    stubVibrate(vibrate);

    attemptTouchHapticFeedback('touch');

    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it('does not attempt vibration for mouse activation', () => {
    const vibrate = vi.fn();
    stubVibrate(vibrate);

    attemptTouchHapticFeedback('mouse');

    expect(vibrate).not.toHaveBeenCalled();
  });

  it('does not throw when vibrate is unsupported', () => {
    stubVibrate(undefined);

    expect(() => {
      attemptTouchHapticFeedback('touch');
    }).not.toThrow();
  });

  it('does not throw when vibrate rejects', () => {
    stubVibrate(() => {
      throw new Error('rejected outside a user gesture');
    });

    expect(() => {
      attemptTouchHapticFeedback('touch');
    }).not.toThrow();
  });
});

describe('scheduleTouchDragCleanup', () => {
  let rafCallback: FrameRequestCallback | undefined;

  beforeEach(() => {
    rafCallback = undefined;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        rafCallback = callback;
        return 0;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const flushRaf = () => rafCallback?.(0);

  it('schedules exactly one animation frame for a touch drag', () => {
    scheduleTouchDragCleanup('touch', null);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('schedules cleanup for a pen drag', () => {
    scheduleTouchDragCleanup('pen', null);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('does not schedule cleanup for a mouse drag', () => {
    scheduleTouchDragCleanup('mouse', null);

    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('clears the active document selection', () => {
    const container = document.createElement('div');
    container.textContent = 'selectable text';
    document.body.append(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(document.getSelection()?.toString()).toBe('selectable text');

    scheduleTouchDragCleanup('touch', null);
    flushRaf();

    expect(document.getSelection()?.toString()).toBe('');
  });

  it('blurs the focused element when it is the active sortable source', () => {
    const source = document.createElement('button');
    document.body.append(source);
    source.focus();

    expect(document.activeElement).toBe(source);

    scheduleTouchDragCleanup('touch', source);
    flushRaf();

    expect(document.activeElement).not.toBe(source);
  });

  it('blurs the focused element when it is contained by the active sortable source', () => {
    const source = document.createElement('div');
    const handle = document.createElement('button');
    source.append(handle);
    document.body.append(source);
    handle.focus();

    expect(document.activeElement).toBe(handle);

    scheduleTouchDragCleanup('touch', source);
    flushRaf();

    expect(document.activeElement).not.toBe(handle);
  });

  it('does not blur a focused element outside the active sortable source', () => {
    const source = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(source, outside);
    outside.focus();

    scheduleTouchDragCleanup('touch', source);
    flushRaf();

    expect(document.activeElement).toBe(outside);
  });
});
