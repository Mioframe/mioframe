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

  it('beforeBreadcrumb drops removed webFileSystem.read/stat/directory categories', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.read',
          data: { operation: 'readFile', provider: 'webFileSystem' },
          message: 'file read failed',
        }),
      ),
    ).toBeNull();

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.stat',
          data: { operation: 'statFile', provider: 'webFileSystem' },
          message: 'stat failed',
        }),
      ),
    ).toBeNull();

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.directory',
          data: { operation: 'readDirectory', provider: 'webFileSystem' },
          message: 'directory read failed',
        }),
      ),
    ).toBeNull();
  });

  it('beforeBreadcrumb strips sensitive write data, keeping only safe non-denylist fields', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'writeFile',
            provider: 'webFileSystem',
            path: '/secret',
            filename: 'doc.amrg', // 'filename' is in denylist
            documentId: 'doc-123',
            storageKey: 'secret-key',
            bytes: '100', // 'bytes' is in denylist
            pendingCount: 2,
          },
          message: 'file write failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'writeFile',
        provider: 'webFileSystem',
        pendingCount: 2,
      },
      level: 'info',
      message: 'file write failed',
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

  it('beforeBreadcrumb strips sensitive key names regardless of their values', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'writeFile',
            provider: 'webFileSystem',
            path: '/user-dir/abc123.automerge',
            directoryName: 'my-repository',
            documentTitle: 'Secret Doc',
          },
          message: 'file write failed',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'writeFile',
        provider: 'webFileSystem',
      },
      level: 'info',
      message: 'file write failed',
    });
  });

  // Shape-based sanitizer: unknown safe primitive keys

  it('unknown safe primitive string key survives without registration', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            someNewDiagnosticField: 'safeValue',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
        someNewDiagnosticField: 'safeValue',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  // Sensitive key denylist

  it('sensitive key names are dropped even when their values are primitive', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            title: 'My Document',
            content: 'some text',
            token: 'abc123',
            secret: 'hunter2',
            email: 'user@example.com',
            stack: 'Error: boom\n  at foo.ts:1',
            storageKey: 'sk-123',
            documentId: 'doc-456',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
        title: 'My Document',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('sensitive key denylist is case-insensitive', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            PATH: '/root',
            Message: 'raw error text',
            STACK: 'trace',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  // Unsafe value types

  it('object, array, Error, and handle-like values are dropped', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            objectValue: { nested: true },
            arrayValue: [1, 2, 3],
            errorValue: new Error('boom'),
            domExValue: new DOMException('fail'),
            nullValue: null,
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  // Numbers

  it('finite numbers survive', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            pendingCount: 5,
            flushedCount: 0,
          },
          message: 'counts',
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        pendingCount: 5,
        flushedCount: 0,
      },
      level: 'info',
      message: 'counts',
    });
  });

  it('NaN and infinities are dropped', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            nanValue: NaN,
            infValue: Infinity,
            negInfValue: -Infinity,
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  // Booleans

  it('booleans survive', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            succeeded: true,
            retried: false,
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
        succeeded: true,
        retried: false,
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('all string fields use the same 80-char limit regardless of key name', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');
    // 114 chars — above the 80-char limit for all string fields
    const longValue =
      'vBfbhfCLoCspTDKPmaXkbk3Z7GH_incremental_4a8b2c9d3e1f7a5b0c2d4e6f8a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d.automerge';

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          category: 'webFileSystem.write',
          data: {
            operation: 'writableOpen',
            provider: 'webFileSystem',
            someFileName: longValue,
          },
          message: 'writable open started',
        }),
      ),
    ).toEqual({
      category: 'webFileSystem.write',
      data: {
        operation: 'writableOpen',
        provider: 'webFileSystem',
      },
      level: 'info',
      message: 'writable open started',
    });
  });

  // Value sanitizer

  it('drops string values that look like filesystem paths', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            result: '/home/user/documents/secret.txt',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('drops string values that look like URLs', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            result: 'https://example.com/secret',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('drops string values that look like email addresses', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            result: 'user@example.com',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('drops string values that look like Automerge storage keys', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            result: 'vBfbhfCLoCspTDKPmaXkbk3Z7GH~s~DfpDUK_a0N8aSEsAbkhUzshkDUFnRc4MyH.am',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
      },
      level: 'info',
      message: 'repository save started',
    });
  });

  it('keeps safe short enum-like string values', () => {
    const beforeBreadcrumb = createBeforeBreadcrumb('production', () => 'enabled');

    expect(
      beforeBreadcrumb(
        makeBreadcrumb({
          data: {
            operation: 'repositorySave',
            result: 'succeeded',
            provider: 'webFileSystem',
            step: 'writableOpen',
            runtime: 'worker',
          },
        }),
      ),
    ).toEqual({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
        result: 'succeeded',
        provider: 'webFileSystem',
        step: 'writableOpen',
        runtime: 'worker',
      },
      level: 'info',
      message: 'repository save started',
    });
  });
});
