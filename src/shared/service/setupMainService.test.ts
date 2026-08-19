import { describe, expect, it, vi } from 'vitest';

vi.mock('../serviceClient/fileSystem/useFileSystemAccessPermissionBroker', () => {
  throw new Error('setupMainService must not import the main-thread permission broker');
});

describe('setupMainService', () => {
  it('initializes without importing the main-thread permission broker', async () => {
    await expect(import('./setupMainService')).resolves.toMatchObject({
      serviceId: 'mainBackgroundService',
      setupMainService: expect.any(Function),
    });
  });

  it('narrows the file-system service to exclude internal repository lifecycle registration from the worker/client surface', async () => {
    const { toPublicFileSystemService } = await import('./setupMainService');
    const fakeFileSystemService = {
      addDeviceDirectory: vi.fn(),
      deviceFiles: 'deviceFiles-placeholder',
      registerConfirmedReplacementLeaseProvider: vi.fn(),
      registerWriteAccessRecoveryHandler: vi.fn(),
      replaceRememberedDeviceDirectory: vi.fn(),
    };

    const publicFileSystemService = toPublicFileSystemService(fakeFileSystemService);

    expect(publicFileSystemService).not.toHaveProperty('registerConfirmedReplacementLeaseProvider');
    expect(publicFileSystemService).not.toHaveProperty('registerWriteAccessRecoveryHandler');
    expect(publicFileSystemService).toEqual({
      addDeviceDirectory: fakeFileSystemService.addDeviceDirectory,
      deviceFiles: 'deviceFiles-placeholder',
      replaceRememberedDeviceDirectory: fakeFileSystemService.replaceRememberedDeviceDirectory,
    });
  });
});
