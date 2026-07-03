import { describe, expect, it, vi } from 'vitest';

import { restoreGhPagesSpaFallbackPath } from './ghPagesSpaFallback';

function withMockedWindow(
  storedValue: string | null,
  run: (history: { replaceState: ReturnType<typeof vi.fn> }) => void,
) {
  const getItem = vi.fn(() => storedValue);
  const removeItem = vi.fn();
  const replaceState = vi.fn();

  const sessionStorage = { getItem, removeItem };
  const history = { replaceState };

  const originalSessionStorage = window.sessionStorage;
  const originalHistory = window.history;

  Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
  Object.defineProperty(window, 'history', { configurable: true, value: history });

  try {
    run(history);
  } finally {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
    Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
  }

  return { getItem, removeItem, replaceState };
}

describe('restoreGhPagesSpaFallbackPath', () => {
  it('restores a stable deep link when the current base is stable', () => {
    const { getItem, removeItem, replaceState } = withMockedWindow('/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/')).toBe('/home');
    });
    expect(getItem).toHaveBeenCalledWith('ghPagesSpaFallback');
    expect(removeItem).toHaveBeenCalledWith('ghPagesSpaFallback');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/home');
  });

  it('restores a branch deep link when the current base is that branch', () => {
    const { replaceState } = withMockedWindow('/branch/develop/settings/documents', () => {
      expect(restoreGhPagesSpaFallbackPath('/branch/develop/')).toBe(
        '/branch/develop/settings/documents',
      );
    });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/branch/develop/settings/documents');
  });

  it('restores a PR preview deep link when the current base is that PR preview', () => {
    const { replaceState } = withMockedWindow('/pr/86/settings/documents', () => {
      expect(restoreGhPagesSpaFallbackPath('/pr/86/')).toBe('/pr/86/settings/documents');
    });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/pr/86/settings/documents');
  });

  it('rejects a path outside the current base', () => {
    const { replaceState } = withMockedWindow('/other-repo/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/branch/develop/')).toBeNull();
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('rejects another PR preview path when running inside a specific PR preview base', () => {
    const { replaceState } = withMockedWindow('/pr/123/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/pr/86/')).toBeNull();
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('rejects a branch path when running inside a different branch base', () => {
    const { replaceState } = withMockedWindow('/branch/feature-x/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/branch/develop/')).toBeNull();
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('rejects a branch path when running inside the stable base', () => {
    const { replaceState } = withMockedWindow('/branch/develop/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/')).toBeNull();
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('rejects a PR preview path when running inside the stable base', () => {
    const { replaceState } = withMockedWindow('/pr/123/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/')).toBeNull();
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('allows PR-preview-base routes whose next segment happens to look like a branch/pr root', () => {
    const { replaceState } = withMockedWindow('/pr/86/branch/pr/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/pr/86/')).toBe('/pr/86/branch/pr/home');
    });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/pr/86/branch/pr/home');
  });

  it('preserves the query string', () => {
    const { replaceState } = withMockedWindow('/settings/documents?tab=recent', () => {
      expect(restoreGhPagesSpaFallbackPath('/')).toBe('/settings/documents?tab=recent');
    });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/settings/documents?tab=recent');
  });

  it('does not throw if sessionStorage is unavailable', () => {
    const originalSessionStorage = window.sessionStorage;

    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });

    try {
      expect(() => restoreGhPagesSpaFallbackPath('/')).not.toThrow();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
    }
  });

  it('returns null without rewriting when no fallback value is stored', () => {
    const { removeItem, replaceState } = withMockedWindow(null, () => {
      expect(restoreGhPagesSpaFallbackPath('/')).toBeNull();
    });
    expect(removeItem).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('continues restoring when fallback cleanup throws', () => {
    const getItem = vi.fn(() => '/home');
    const removeItem = vi.fn(() => {
      throw new Error('blocked cleanup');
    });
    const replaceState = vi.fn();

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: { getItem, removeItem },
    });
    Object.defineProperty(window, 'history', { configurable: true, value: { replaceState } });

    try {
      expect(restoreGhPagesSpaFallbackPath('/')).toBe('/home');
      expect(replaceState).toHaveBeenCalledWith(null, '', '/home');
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('does not restore malformed values', () => {
    const { replaceState } = withMockedWindow('javascript:alert(1)', () => {
      expect(restoreGhPagesSpaFallbackPath('/')).toBeNull();
    });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('does not restore protocol-relative values', () => {
    const { replaceState } = withMockedWindow('//evil.example/home', () => {
      expect(restoreGhPagesSpaFallbackPath('/')).toBeNull();
    });
    expect(replaceState).not.toHaveBeenCalled();
  });
});
