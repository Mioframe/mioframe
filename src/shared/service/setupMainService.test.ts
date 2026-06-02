import { describe, expect, it, vi } from 'vitest';

vi.mock('./fileSystemClient/useFileSystemAccessPermissionBroker', () => {
  throw new Error('setupMainService must not import the main-thread permission broker');
});

describe('setupMainService', () => {
  it('initializes without importing the main-thread permission broker', async () => {
    await expect(import('./setupMainService')).resolves.toMatchObject({
      serviceId: 'mainBackgroundService',
      setupMainService: expect.any(Function),
    });
  });
});
