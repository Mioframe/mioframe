import { describe, expect, it, vi } from 'vitest';

import { restoreGhPagesSpaFallbackPath } from './ghPagesSpaFallback';

describe('restoreGhPagesSpaFallbackPath', () => {
  it('restores a stable deep link when the current base is stable', () => {
    const getItem = vi.fn(() => '/mioframe/home');
    const removeItem = vi.fn();
    const replaceState = vi.fn();

    const sessionStorage = { getItem, removeItem };
    const history = { replaceState };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBe('/mioframe/home');
      expect(getItem).toHaveBeenCalledWith('ghPagesSpaFallback');
      expect(removeItem).toHaveBeenCalledWith('ghPagesSpaFallback');
      expect(replaceState).toHaveBeenCalledWith(null, '', '/mioframe/home');
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('restores a PR preview deep link when the current base is that PR preview', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '/mioframe/pr-86/settings/documents'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/pr-86/')).toBe(
        '/mioframe/pr-86/settings/documents',
      );
      expect(history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/mioframe/pr-86/settings/documents',
      );
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('rejects a path outside the current base', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '/other-repo/home'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBeNull();
      expect(history.replaceState).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('rejects another PR preview path when running inside a specific PR preview base', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '/mioframe/pr-123/home'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/pr-86/')).toBeNull();
      expect(history.replaceState).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('rejects a PR preview path when running inside the stable base', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '/mioframe/pr-123/home'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBeNull();
      expect(history.replaceState).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('allows preview-base routes whose next segment happens to look like another preview id', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '/mioframe/pr-86/pr-123/home'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/pr-86/')).toBe('/mioframe/pr-86/pr-123/home');
      expect(history.replaceState).toHaveBeenCalledWith(null, '', '/mioframe/pr-86/pr-123/home');
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('preserves the query string', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '/mioframe/settings/documents?tab=recent'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBe(
        '/mioframe/settings/documents?tab=recent',
      );
      expect(history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/mioframe/settings/documents?tab=recent',
      );
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
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
      expect(() => restoreGhPagesSpaFallbackPath('/mioframe/')).not.toThrow();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
    }
  });

  it('returns null without rewriting when no fallback value is stored', () => {
    const sessionStorage = {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBeNull();
      expect(sessionStorage.removeItem).not.toHaveBeenCalled();
      expect(history.replaceState).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('continues restoring when fallback cleanup throws', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '/mioframe/home'),
      removeItem: vi.fn(() => {
        throw new Error('blocked cleanup');
      }),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBe('/mioframe/home');
      expect(history.replaceState).toHaveBeenCalledWith(null, '', '/mioframe/home');
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('does not restore malformed values', () => {
    const sessionStorage = {
      getItem: vi.fn(() => 'javascript:alert(1)'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBeNull();
      expect(history.replaceState).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });

  it('does not restore protocol-relative values', () => {
    const sessionStorage = {
      getItem: vi.fn(() => '//evil.example/mioframe/home'),
      removeItem: vi.fn(),
    };
    const history = { replaceState: vi.fn() };

    const originalSessionStorage = window.sessionStorage;
    const originalHistory = window.history;

    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: sessionStorage });
    Object.defineProperty(window, 'history', { configurable: true, value: history });

    try {
      expect(restoreGhPagesSpaFallbackPath('/mioframe/')).toBeNull();
      expect(history.replaceState).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: originalSessionStorage,
      });
      Object.defineProperty(window, 'history', { configurable: true, value: originalHistory });
    }
  });
});
