import { afterEach, describe, expect, it, vi } from 'vitest';
import { reportAppBootOk } from './bootReport';

afterEach(() => {
  delete window.mioframeAppUpdateBootOk;
});

describe('reportAppBootOk', () => {
  it('calls the watchdog-defined global function when present', () => {
    const bootOk = vi.fn();
    window.mioframeAppUpdateBootOk = bootOk;

    reportAppBootOk();

    expect(bootOk).toHaveBeenCalledOnce();
  });

  it('is a no-op when no watchdog is active', () => {
    expect(() => {
      reportAppBootOk();
    }).not.toThrow();
  });
});
