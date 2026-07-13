import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireActiveSessionEffects } from './activeSessionEffects';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('acquireActiveSessionEffects', () => {
  it('returns null and installs nothing when pointer capture cannot be acquired', () => {
    const containerEl = document.createElement('div');
    containerEl.setPointerCapture = () => {
      throw new Error('no such pointer');
    };
    const addEventListener = vi.spyOn(containerEl, 'addEventListener');

    const effects = acquireActiveSessionEffects(containerEl, 1, 'mouse', vi.fn());

    expect(effects).toBeNull();
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it('installs touch guards only for pointerType "touch"', () => {
    const containerEl = document.createElement('div');
    containerEl.setPointerCapture = vi.fn();
    containerEl.hasPointerCapture = () => true;
    containerEl.releasePointerCapture = vi.fn();

    const mouseEffects = acquireActiveSessionEffects(containerEl, 1, 'mouse', vi.fn());
    const touchmoveEvent = new Event('touchmove', { cancelable: true });
    containerEl.dispatchEvent(touchmoveEvent);
    expect(touchmoveEvent.defaultPrevented).toBe(false);
    mouseEffects?.dispose();

    const touchEffects = acquireActiveSessionEffects(containerEl, 2, 'touch', vi.fn());
    const touchmoveEvent2 = new Event('touchmove', { cancelable: true });
    containerEl.dispatchEvent(touchmoveEvent2);
    expect(touchmoveEvent2.defaultPrevented).toBe(true);
    touchEffects?.dispose();
  });

  it('suppresses text selection while active, regardless of pointer type', () => {
    document.body.append(document.createElement('div'));
    const containerEl = document.createElement('div');
    containerEl.setPointerCapture = vi.fn();
    containerEl.hasPointerCapture = () => true;
    containerEl.releasePointerCapture = vi.fn();
    document.body.append(containerEl);

    const effects = acquireActiveSessionEffects(containerEl, 1, 'mouse', vi.fn());
    const selectStartEvent = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(selectStartEvent);
    expect(selectStartEvent.defaultPrevented).toBe(true);

    effects?.dispose();
    const selectStartAfterDispose = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(selectStartAfterDispose);
    expect(selectStartAfterDispose.defaultPrevented).toBe(false);
  });

  it('invokes onLostPointerCapture when the browser revokes capture', () => {
    const containerEl = document.createElement('div');
    containerEl.setPointerCapture = vi.fn();
    containerEl.hasPointerCapture = () => true;
    containerEl.releasePointerCapture = vi.fn();
    const onLostPointerCapture = vi.fn();

    acquireActiveSessionEffects(containerEl, 1, 'mouse', onLostPointerCapture);
    containerEl.dispatchEvent(new Event('lostpointercapture'));

    expect(onLostPointerCapture).toHaveBeenCalledTimes(1);
  });

  it('dispose releases pointer capture and removes every listener', () => {
    const containerEl = document.createElement('div');
    containerEl.setPointerCapture = vi.fn();
    containerEl.hasPointerCapture = () => true;
    const releasePointerCapture = vi.fn();
    containerEl.releasePointerCapture = releasePointerCapture;
    const onLostPointerCapture = vi.fn();

    const effects = acquireActiveSessionEffects(containerEl, 5, 'touch', onLostPointerCapture);
    effects?.dispose();

    expect(releasePointerCapture).toHaveBeenCalledWith(5);

    containerEl.dispatchEvent(new Event('lostpointercapture'));
    expect(onLostPointerCapture).not.toHaveBeenCalled();

    const touchmoveEvent = new Event('touchmove', { cancelable: true });
    containerEl.dispatchEvent(touchmoveEvent);
    expect(touchmoveEvent.defaultPrevented).toBe(false);
  });

  it('does not throw when pointer capture was already released by the browser', () => {
    const containerEl = document.createElement('div');
    containerEl.setPointerCapture = vi.fn();
    containerEl.hasPointerCapture = () => true;
    containerEl.releasePointerCapture = () => {
      throw new Error('already released');
    };

    const effects = acquireActiveSessionEffects(containerEl, 1, 'mouse', vi.fn());

    expect(() => effects?.dispose()).not.toThrow();
  });
});
