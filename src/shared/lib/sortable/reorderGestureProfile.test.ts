import { describe, expect, it } from 'vitest';
import { getReorderGestureProfile, getReorderInputFromPointerType } from './reorderGestureProfile';

describe('getReorderGestureProfile', () => {
  it('uses touch defaults for touch-like input', () => {
    const profile = getReorderGestureProfile({
      input: 'touch',
      layout: 'vertical',
      activation: 'immediate',
      density: 'comfortable',
    });

    expect(profile.input).toBe('touch');
    expect(profile.activation).toBe('longPress');
    expect(profile.delay).toBe(180);
    expect(profile.moveThreshold).toBe(6);
  });

  it('keeps dense touch surfaces on long press', () => {
    const profile = getReorderGestureProfile({
      input: 'touch',
      layout: 'grid',
      activation: 'longPress',
      density: 'dense',
    });

    expect(profile.activation).toBe('longPress');
    expect(profile.layout).toBe('grid');
    expect(profile.scrollSensitivity).toBeGreaterThan(40);
  });

  it('uses immediate desktop pointer defaults', () => {
    const profile = getReorderGestureProfile({
      input: 'pointer',
      layout: 'horizontal',
      activation: 'immediate',
      density: 'precision',
    });

    expect(profile.delay).toBe(0);
    expect(profile.moveThreshold).toBe(3);
    expect(profile.suppressClickAfterDrag).toBe(true);
  });

  it('resolves full-row native touch input to a long-press delay', () => {
    const profile = getReorderGestureProfile({
      input: 'touch',
      layout: 'vertical',
      activation: 'fullRowNative',
      density: 'comfortable',
    });

    expect(profile.activation).toBe('fullRowNative');
    expect(profile.delay).toBe(180);
    expect(profile.moveThreshold).toBe(6);
  });

  it('resolves full-row native mouse input to a zero delay gated by movement threshold', () => {
    const profile = getReorderGestureProfile({
      input: 'pointer',
      layout: 'vertical',
      activation: 'fullRowNative',
      density: 'comfortable',
    });

    expect(profile.activation).toBe('fullRowNative');
    expect(profile.delay).toBe(0);
    expect(profile.moveThreshold).toBe(4);
  });
});

describe('getReorderInputFromPointerType', () => {
  it('treats pen input like touch input', () => {
    expect(getReorderInputFromPointerType('pen')).toBe('touch');
  });

  it('maps mouse pointers to pointer input', () => {
    expect(getReorderInputFromPointerType('mouse')).toBe('pointer');
  });
});
