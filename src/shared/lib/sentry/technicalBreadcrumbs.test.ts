import type { Breadcrumb } from '@sentry/vue';
import { describe, expect, it } from 'vitest';
import {
  createBeforeBreadcrumb,
  sanitizeTechnicalBreadcrumb,
  sanitizeTechnicalBreadcrumbs,
} from './technicalBreadcrumbs';

const makeBreadcrumb = (overrides: Partial<Breadcrumb> = {}): Breadcrumb => ({
  category: 'repository.storage',
  data: {
    operation: 'repositorySave',
  },
  message: 'repository save started',
  ...overrides,
});

describe('technicalBreadcrumbs', () => {
  it('beforeBreadcrumb keeps allowed technical breadcrumbs', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(beforeBreadcrumb(makeBreadcrumb())).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('beforeBreadcrumb drops unknown categories', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(beforeBreadcrumb(makeBreadcrumb({ category: 'ui.click' }))).toBeNull();
  });

  it('beforeBreadcrumb keeps new web file system read categories and strips private fields', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.read',
          data: {
            operation: 'readFile',
            provider: 'webFileSystem',
            path: '/secret',
            errorClass: 'DOMException',
            domExceptionName: 'InvalidStateError',
          },
          message: 'file read failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.read',
      data: {
        operation: 'readFile',
        provider: 'webFileSystem',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'info',
      message: 'file read failed',
    });
  });

  it('beforeBreadcrumb keeps writeStrategy and strips probe-private write data', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'directCreateWrite',
            provider: 'webFileSystem',
            writeStrategy: 'directCreateWriteProbe',
            path: '/secret',
            filename: 'doc.amrg',
            documentId: 'doc-123',
            storageKey: 'secret-key',
            bytes: '100',
            pendingCount: 2,
          },
          message: 'direct create write failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWrite',
        provider: 'webFileSystem',
        writeStrategy: 'directCreateWriteProbe',
        pendingCount: 2,
      },
      level: 'info',
      message: 'direct create write failed',
    });
  });

  it('beforeBreadcrumb drops automatic navigation and fetch breadcrumbs', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(beforeBreadcrumb(makeBreadcrumb({ category: 'navigation', message: 'navigated' }))).toBe(
      null,
    );
    expect(beforeBreadcrumb(makeBreadcrumb({ category: 'http', message: 'GET /secret' }))).toBe(
      null,
    );
  });

  it('beforeBreadcrumb strips forbidden data fields', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            path: '/secret',
            provider: 'webFileSystem',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
        provider: 'webFileSystem',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('beforeBreadcrumb drops empty breadcrumbs', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            path: '/secret',
          },
          message: '   ',
        }),
      ),
    ).toBeNull();
  });

  it('production drops debug technical breadcrumbs', () => {
    expect(
      sanitizeTechnicalBreadcrumb(
        makeBreadcrumb({
          level: 'debug',
        }),
        'production',
      ),
    ).toBeNull();
  });

  it('preview keeps debug technical breadcrumbs and still strips private fields', () => {
    expect(
      sanitizeTechnicalBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            path: '/secret',
          },
          level: 'debug',
        }),
        'preview',
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'debug',
      message: 'repository save started',
    });
  });

  it('sanitizes breadcrumb arrays for beforeSend defense in depth', () => {
    expect(
      sanitizeTechnicalBreadcrumbs(
        [makeBreadcrumb(), makeBreadcrumb({ category: 'ui.click', message: 'clicked button' })],
        'production',
      ),
    ).toEqual([
      {
        category: 'repository.storage',
        data: {
          operation: 'repositorySave',
        },
        level: 'info',
        message: 'repository save started',
      },
    ]);
  });

  it('beforeBreadcrumb drops breadcrumbs when reporting state is unknown', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'unknown');

    expect(beforeBreadcrumb(makeBreadcrumb())).toBeNull();
  });

  it('beforeBreadcrumb drops breadcrumbs when reporting state is disabled', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'disabled');

    expect(beforeBreadcrumb(makeBreadcrumb())).toBeNull();
  });

  // TODO(PR #85): these tests cover temporary basename fields; remove together with the fields after investigation
  it('beforeBreadcrumb passes targetFileName and probeFileName through for write breadcrumbs', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'directCreateWriteWritableOpen',
            provider: 'webFileSystem',
            writeStrategy: 'directCreateWriteProbe',
            targetFileName: 'abc123.automerge',
          },
          message: 'direct create write writable open failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWriteWritableOpen',
        provider: 'webFileSystem',
        writeStrategy: 'directCreateWriteProbe',
        targetFileName: 'abc123.automerge',
      },
      level: 'info',
      message: 'direct create write writable open failed',
    });
  });

  it('beforeBreadcrumb passes long Automerge-like targetFileName (>80 chars) through without truncation', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');
    // Realistic Automerge filename: {27-char-docId}_incremental_{64-char-hex-hash}.automerge (~114 chars)
    const longFileName =
      'vBfbhfCLoCspTDKPmaXkbk3Z7GH_incremental_4a8b2c9d3e1f7a5b0c2d4e6f8a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d.automerge';

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'directCreateWriteWritableOpen',
            provider: 'webFileSystem',
            writeStrategy: 'directCreateWriteProbe',
            targetFileName: longFileName,
            targetFileNameLength: longFileName.length,
          },
          message: 'direct create write writable open failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWriteWritableOpen',
        provider: 'webFileSystem',
        writeStrategy: 'directCreateWriteProbe',
        targetFileName: longFileName,
        targetFileNameLength: longFileName.length,
      },
      level: 'info',
      message: 'direct create write writable open failed',
    });
  });

  it('beforeBreadcrumb passes targetFileNameLength through as a number', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'directCreateWriteWritableOpen',
            provider: 'webFileSystem',
            writeStrategy: 'directCreateWriteProbe',
            targetFileName: 'abc123.automerge',
            targetFileNameLength: 16,
          },
          message: 'direct create write writable open failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWriteWritableOpen',
        provider: 'webFileSystem',
        writeStrategy: 'directCreateWriteProbe',
        targetFileName: 'abc123.automerge',
        targetFileNameLength: 16,
      },
      level: 'info',
      message: 'direct create write writable open failed',
    });
  });

  it('beforeBreadcrumb still applies the standard 80-char limit to non-filename fields', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');
    const longOperation = 'a'.repeat(81);

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: longOperation,
            provider: 'webFileSystem',
          },
          message: 'direct create write started',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        provider: 'webFileSystem',
      },
      level: 'info',
      message: 'direct create write started',
    });
  });

  it('beforeBreadcrumb passes probeFileName through for ASCII probe write breadcrumbs', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'asciiWriteProbe',
            provider: 'webFileSystem',
            writeStrategy: 'directCreateWriteProbe',
            probeFileName: 'mioframe-write-probe.tmp',
          },
          message: 'asciiWriteProbe succeeded',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbe',
        provider: 'webFileSystem',
        writeStrategy: 'directCreateWriteProbe',
        probeFileName: 'mioframe-write-probe.tmp',
      },
      level: 'info',
      message: 'asciiWriteProbe succeeded',
    });
  });

  it('beforeBreadcrumb still strips full paths and directory names even when basename fields are present', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'directCreateWrite',
            provider: 'webFileSystem',
            targetFileName: 'abc123.automerge',
            path: '/user-dir/abc123.automerge',
            directoryName: 'my-repository',
            documentTitle: 'Secret Doc',
          },
          message: 'direct create write failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWrite',
        provider: 'webFileSystem',
        targetFileName: 'abc123.automerge',
      },
      level: 'info',
      message: 'direct create write failed',
    });
  });
});
