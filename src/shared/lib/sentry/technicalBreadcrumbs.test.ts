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
});
