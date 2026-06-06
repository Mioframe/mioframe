import type { SentryReportingState } from '@shared/lib/sentry';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const addBreadcrumbMock = vi.fn();
const getSentryReportingStateMock = vi.hoisted(() =>
  vi.fn<() => SentryReportingState>(() => 'enabled'),
);

vi.mock('@shared/lib/setupSentry', () => ({
  getSentryReportingState: getSentryReportingStateMock,
  useSentry: () => ({
    addBreadcrumb: addBreadcrumbMock,
  }),
}));

describe('addTechnicalBreadcrumb', () => {
  beforeEach(() => {
    addBreadcrumbMock.mockReset();
    getSentryReportingStateMock.mockReset();
    getSentryReportingStateMock.mockReturnValue('enabled');
  });

  it('forwards a technical breadcrumb through the shared facade', async () => {
    const { addTechnicalBreadcrumb } = await import('./addTechnicalBreadcrumb');

    addTechnicalBreadcrumb({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
        provider: 'webFileSystem',
      },
      level: 'warning',
      message: 'repository save queued',
    });

    expect(addBreadcrumbMock).toHaveBeenCalledWith({
      category: 'repository.storage',
      data: {
        operation: 'repositorySave',
        provider: 'webFileSystem',
      },
      level: 'warning',
      message: 'repository save queued',
      type: 'default',
    });
  });

  it('swallows facade errors', async () => {
    addBreadcrumbMock.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const { addTechnicalBreadcrumb } = await import('./addTechnicalBreadcrumb');

    expect(() => {
      addTechnicalBreadcrumb({
        category: 'sentry.runtime',
        message: 'runtime initialized',
      });
    }).not.toThrow();
  });

  it('does nothing when reporting state is unknown', async () => {
    getSentryReportingStateMock.mockReturnValue('unknown');
    const { addTechnicalBreadcrumb } = await import('./addTechnicalBreadcrumb');

    addTechnicalBreadcrumb({
      category: 'repository.storage',
      message: 'repository save queued',
    });

    expect(addBreadcrumbMock).not.toHaveBeenCalled();
  });

  it('does nothing when reporting state is disabled', async () => {
    getSentryReportingStateMock.mockReturnValue('disabled');
    const { addTechnicalBreadcrumb } = await import('./addTechnicalBreadcrumb');

    addTechnicalBreadcrumb({
      category: 'repository.storage',
      message: 'repository save queued',
    });

    expect(addBreadcrumbMock).not.toHaveBeenCalled();
  });
});
