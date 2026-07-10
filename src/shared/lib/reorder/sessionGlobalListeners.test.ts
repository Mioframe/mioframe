import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSessionGlobalListeners,
  type SessionGlobalListenerCallbacks,
} from './sessionGlobalListeners';

const createCallbacks = (): SessionGlobalListenerCallbacks => ({
  onPointerMove: vi.fn(),
  onPointerUp: vi.fn(),
  onPointerCancel: vi.fn(),
  onSecondPointerDown: vi.fn(),
  onWindowBlur: vi.fn(),
  onVisibilityChange: vi.fn(),
  onEscapeKeyDown: vi.fn(),
});

const pointerEvent = (type: string, pointerId: number): PointerEvent =>
  new PointerEvent(type, { bubbles: true, cancelable: true, pointerId });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createSessionGlobalListeners', () => {
  it('does nothing until attached', () => {
    const callbacks = createCallbacks();
    createSessionGlobalListeners(callbacks);

    window.dispatchEvent(pointerEvent('pointermove', 1));

    expect(callbacks.onPointerMove).not.toHaveBeenCalled();
  });

  it('invokes the matching callback for move/up/cancel while attached', () => {
    const callbacks = createCallbacks();
    const listeners = createSessionGlobalListeners(callbacks);
    listeners.attach();

    window.dispatchEvent(pointerEvent('pointermove', 1));
    window.dispatchEvent(pointerEvent('pointerup', 1));
    window.dispatchEvent(pointerEvent('pointercancel', 1));

    expect(callbacks.onPointerMove).toHaveBeenCalledTimes(1);
    expect(callbacks.onPointerUp).toHaveBeenCalledTimes(1);
    expect(callbacks.onPointerCancel).toHaveBeenCalledTimes(1);

    listeners.detach();
  });

  it('stops invoking callbacks after detach', () => {
    const callbacks = createCallbacks();
    const listeners = createSessionGlobalListeners(callbacks);
    listeners.attach();
    listeners.detach();

    window.dispatchEvent(pointerEvent('pointermove', 1));
    window.dispatchEvent(new Event('blur'));

    expect(callbacks.onPointerMove).not.toHaveBeenCalled();
    expect(callbacks.onWindowBlur).not.toHaveBeenCalled();
  });

  it('invokes onWindowBlur and onVisibilityChange', () => {
    const callbacks = createCallbacks();
    const listeners = createSessionGlobalListeners(callbacks);
    listeners.attach();

    window.dispatchEvent(new Event('blur'));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(callbacks.onWindowBlur).toHaveBeenCalledTimes(1);
    expect(callbacks.onVisibilityChange).toHaveBeenCalledTimes(1);

    listeners.detach();
  });

  it('invokes onEscapeKeyDown only for the Escape key', () => {
    const callbacks = createCallbacks();
    const listeners = createSessionGlobalListeners(callbacks);
    listeners.attach();

    const otherKey = new Event('keydown', { bubbles: true });
    Object.defineProperty(otherKey, 'key', { value: 'a', configurable: true });
    document.dispatchEvent(otherKey);
    expect(callbacks.onEscapeKeyDown).not.toHaveBeenCalled();

    const escapeKey = new Event('keydown', { bubbles: true });
    Object.defineProperty(escapeKey, 'key', { value: 'Escape', configurable: true });
    document.dispatchEvent(escapeKey);
    expect(callbacks.onEscapeKeyDown).toHaveBeenCalledTimes(1);

    listeners.detach();
  });

  describe('second-pointer guard', () => {
    it('invokes onSecondPointerDown for a pointerdown, without consuming the event', () => {
      const callbacks = createCallbacks();
      const listeners = createSessionGlobalListeners(callbacks);
      listeners.attach();

      const event = pointerEvent('pointerdown', 2);
      const stopPropagation = vi.spyOn(event, 'stopPropagation');
      const stopImmediatePropagation = vi.spyOn(event, 'stopImmediatePropagation');
      const preventDefault = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(callbacks.onSecondPointerDown).toHaveBeenCalledWith(event);
      expect(stopPropagation).not.toHaveBeenCalled();
      expect(stopImmediatePropagation).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();

      listeners.detach();
    });

    it('still lets an external listener on the same target observe the event', () => {
      const callbacks = createCallbacks();
      const listeners = createSessionGlobalListeners(callbacks);
      listeners.attach();

      const externalListener = vi.fn();
      window.addEventListener('pointerdown', externalListener);

      window.dispatchEvent(pointerEvent('pointerdown', 2));

      expect(externalListener).toHaveBeenCalledTimes(1);

      window.removeEventListener('pointerdown', externalListener);
      listeners.detach();
    });

    it('marks the exact dispatched event as the second-pointer event, synchronously', () => {
      const callbacks = createCallbacks();
      const listeners = createSessionGlobalListeners(callbacks);
      listeners.attach();

      const event = pointerEvent('pointerdown', 2);
      let markedDuringDispatch = false;
      window.addEventListener('pointerdown', () => {
        markedDuringDispatch = listeners.isSecondPointerEvent(event);
      });

      window.dispatchEvent(event);

      expect(markedDuringDispatch).toBe(true);

      listeners.detach();
    });

    it('does not mark an unrelated pointerdown event', () => {
      const callbacks = createCallbacks();
      const listeners = createSessionGlobalListeners(callbacks);
      listeners.attach();

      window.dispatchEvent(pointerEvent('pointerdown', 2));
      const anotherEvent = pointerEvent('pointerdown', 3);

      expect(listeners.isSecondPointerEvent(anotherEvent)).toBe(false);

      listeners.detach();
    });

    it('clears the marker in a microtask after the dispatch completes', async () => {
      const callbacks = createCallbacks();
      const listeners = createSessionGlobalListeners(callbacks);
      listeners.attach();

      const event = pointerEvent('pointerdown', 2);
      window.dispatchEvent(event);

      expect(listeners.isSecondPointerEvent(event)).toBe(true);

      await Promise.resolve();

      expect(listeners.isSecondPointerEvent(event)).toBe(false);

      listeners.detach();
    });
  });
});
