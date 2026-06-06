import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('diagnosticsRuntimeEffects', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('flushDiagnosticsRuntimeEffects calls all registered flush callbacks', async () => {
    const { registerDiagnosticsRuntimeEffects, flushDiagnosticsRuntimeEffects } =
      await import('./diagnosticsRuntimeEffects');
    const flush1 = vi.fn();
    const flush2 = vi.fn();

    registerDiagnosticsRuntimeEffects({ flush: flush1, clear: vi.fn() });
    registerDiagnosticsRuntimeEffects({ flush: flush2, clear: vi.fn() });

    flushDiagnosticsRuntimeEffects();

    expect(flush1).toHaveBeenCalledOnce();
    expect(flush2).toHaveBeenCalledOnce();
  });

  it('clearDiagnosticsRuntimeEffects calls all registered clear callbacks', async () => {
    const { registerDiagnosticsRuntimeEffects, clearDiagnosticsRuntimeEffects } =
      await import('./diagnosticsRuntimeEffects');
    const clear1 = vi.fn();
    const clear2 = vi.fn();

    registerDiagnosticsRuntimeEffects({ flush: vi.fn(), clear: clear1 });
    registerDiagnosticsRuntimeEffects({ flush: vi.fn(), clear: clear2 });

    clearDiagnosticsRuntimeEffects();

    expect(clear1).toHaveBeenCalledOnce();
    expect(clear2).toHaveBeenCalledOnce();
  });

  it('flush does not call clear, and clear does not call flush', async () => {
    const {
      registerDiagnosticsRuntimeEffects,
      flushDiagnosticsRuntimeEffects,
      clearDiagnosticsRuntimeEffects,
    } = await import('./diagnosticsRuntimeEffects');
    const flush = vi.fn();
    const clear = vi.fn();

    registerDiagnosticsRuntimeEffects({ flush, clear });

    flushDiagnosticsRuntimeEffects();
    expect(flush).toHaveBeenCalledOnce();
    expect(clear).not.toHaveBeenCalled();

    clearDiagnosticsRuntimeEffects();
    expect(clear).toHaveBeenCalledOnce();
    expect(flush).toHaveBeenCalledOnce();
  });

  it('flush and clear are no-ops when no effects are registered', async () => {
    const { flushDiagnosticsRuntimeEffects, clearDiagnosticsRuntimeEffects } =
      await import('./diagnosticsRuntimeEffects');

    expect(() => {
      flushDiagnosticsRuntimeEffects();
      clearDiagnosticsRuntimeEffects();
    }).not.toThrow();
  });
});
