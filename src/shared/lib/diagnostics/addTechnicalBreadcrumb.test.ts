import { beforeEach, describe, expect, it, vi } from 'vitest';

const addBreadcrumbMock = vi.fn();

vi.mock('@shared/lib/setupSentry', () => ({
  useSentry: () => ({
    addBreadcrumb: addBreadcrumbMock,
  }),
}));

describe('addTechnicalBreadcrumb', () => {
  beforeEach(() => {
    addBreadcrumbMock.mockReset();
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
});
