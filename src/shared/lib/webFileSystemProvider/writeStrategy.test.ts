import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEB_FILE_SYSTEM_WRITE_STRATEGY,
  resolveWebFileSystemWriteStrategy,
} from './writeStrategy';

describe('web file system write strategy', () => {
  it('defaults to safeCurrent outside preview diagnostics mode', () => {
    expect(DEFAULT_WEB_FILE_SYSTEM_WRITE_STRATEGY).toBe('safeCurrent');
    expect(
      resolveWebFileSystemWriteStrategy({
        configuredStrategy: 'directCreateWriteProbe',
        diagnosticsMode: 'production',
      }),
    ).toBe('safeCurrent');
  });

  it('allows preview diagnostics builds to select directCreateWriteProbe', () => {
    expect(
      resolveWebFileSystemWriteStrategy({
        configuredStrategy: 'directCreateWriteProbe',
        diagnosticsMode: 'preview',
      }),
    ).toBe('directCreateWriteProbe');
  });
});
