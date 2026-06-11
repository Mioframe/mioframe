import { afterEach, describe, expect, it, vi } from 'vitest';

const mockMatchMedia = (matches: boolean) => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches, media: '', onchange: null }));
};

describe('isStandaloneMode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when display-mode standalone media query matches', async () => {
    mockMatchMedia(true);
    vi.stubGlobal('navigator', { standalone: undefined });
    const { isStandaloneMode } = await import('./isStandaloneMode');
    expect(isStandaloneMode()).toBe(true);
  });

  it('returns true when navigator.standalone is true (iOS Safari)', async () => {
    mockMatchMedia(false);
    vi.stubGlobal('navigator', { standalone: true });
    const { isStandaloneMode } = await import('./isStandaloneMode');
    expect(isStandaloneMode()).toBe(true);
  });

  it('returns false when neither condition is true', async () => {
    mockMatchMedia(false);
    vi.stubGlobal('navigator', { standalone: false });
    const { isStandaloneMode } = await import('./isStandaloneMode');
    expect(isStandaloneMode()).toBe(false);
  });
});
