import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('runtimeEffects', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('flushDiagnosticsRuntimeEffects calls all registered flush callbacks', async () => {
    const { registerDiagnosticsRuntimeEffects, flushDiagnosticsRuntimeEffects } =
      await import('./runtimeEffects');
    const flush1 = vi.fn();
    const flush2 = vi.fn();

    registerDiagnosticsRuntimeEffects('effect1', { flush: flush1, clear: vi.fn() });
    registerDiagnosticsRuntimeEffects('effect2', { flush: flush2, clear: vi.fn() });

    flushDiagnosticsRuntimeEffects();

    expect(flush1).toHaveBeenCalledOnce();
    expect(flush2).toHaveBeenCalledOnce();
  });

  it('clearDiagnosticsRuntimeEffects calls all registered clear callbacks', async () => {
    const { registerDiagnosticsRuntimeEffects, clearDiagnosticsRuntimeEffects } =
      await import('./runtimeEffects');
    const clear1 = vi.fn();
    const clear2 = vi.fn();

    registerDiagnosticsRuntimeEffects('effect1', { flush: vi.fn(), clear: clear1 });
    registerDiagnosticsRuntimeEffects('effect2', { flush: vi.fn(), clear: clear2 });

    clearDiagnosticsRuntimeEffects();

    expect(clear1).toHaveBeenCalledOnce();
    expect(clear2).toHaveBeenCalledOnce();
  });

  it('flush does not call clear, and clear does not call flush', async () => {
    const {
      registerDiagnosticsRuntimeEffects,
      flushDiagnosticsRuntimeEffects,
      clearDiagnosticsRuntimeEffects,
    } = await import('./runtimeEffects');
    const flush = vi.fn();
    const clear = vi.fn();

    registerDiagnosticsRuntimeEffects('effect1', { flush, clear });

    flushDiagnosticsRuntimeEffects();
    expect(flush).toHaveBeenCalledOnce();
    expect(clear).not.toHaveBeenCalled();

    clearDiagnosticsRuntimeEffects();
    expect(clear).toHaveBeenCalledOnce();
    expect(flush).toHaveBeenCalledOnce();
  });

  it('flush and clear are no-ops when no effects are registered', async () => {
    const { flushDiagnosticsRuntimeEffects, clearDiagnosticsRuntimeEffects } =
      await import('./runtimeEffects');

    expect(() => {
      flushDiagnosticsRuntimeEffects();
      clearDiagnosticsRuntimeEffects();
    }).not.toThrow();
  });

  it('re-registering the same key replaces the previous entry without duplicating calls', async () => {
    const { registerDiagnosticsRuntimeEffects, flushDiagnosticsRuntimeEffects } =
      await import('./runtimeEffects');
    const flush1 = vi.fn();
    const flush2 = vi.fn();

    registerDiagnosticsRuntimeEffects('effect1', { flush: flush1, clear: vi.fn() });
    registerDiagnosticsRuntimeEffects('effect1', { flush: flush2, clear: vi.fn() });

    flushDiagnosticsRuntimeEffects();

    expect(flush1).not.toHaveBeenCalled();
    expect(flush2).toHaveBeenCalledOnce();
  });
});
