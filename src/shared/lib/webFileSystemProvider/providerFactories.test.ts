import { describe, expect, it, vi } from 'vitest';
import { createDirectoryHandleMock, createFileHandleMock } from './WebFileSystemProvider.testUtils';
import {
  createMountedWebFileSystemProvider,
  createUserSelectedDirectoryProvider,
} from './providerFactories';

const createRootHandle = () => {
  const fileHandle = createFileHandleMock({
    name: 'doc.amrg',
    permissionState: 'granted',
  });
  const rootHandle = createDirectoryHandleMock({
    entries: [fileHandle],
    name: '',
    permissionState: 'granted',
  });
  return { fileHandle, rootHandle };
};

describe('providerFactories', () => {
  it('createUserSelectedDirectoryProvider uses directCreateWriteProbe strategy', async () => {
    const { rootHandle } = createRootHandle();
    const onDiagnosticStep = vi.fn();
    const provider = createUserSelectedDirectoryProvider(
      rootHandle,
      () => ({ spaceName: 'test', mode: 'readwrite' }),
      onDiagnosticStep,
    );

    await provider.writeFile('/doc.amrg', 'x', { create: true, overwrite: true });

    expect(onDiagnosticStep).toHaveBeenCalledWith(
      expect.objectContaining({ writeStrategy: 'directCreateWriteProbe' }),
    );
  });

  it('createMountedWebFileSystemProvider with localDirectory uses directCreateWriteProbe strategy', async () => {
    const { rootHandle } = createRootHandle();
    const onDiagnosticStep = vi.fn();
    const provider = createMountedWebFileSystemProvider({
      kind: 'localDirectory',
      rootHandle,
      onAccessRequired: () => ({ spaceName: 'test', mode: 'readwrite' }),
      onDiagnosticStep,
    });

    await provider.writeFile('/doc.amrg', 'x', { create: true, overwrite: true });

    expect(onDiagnosticStep).toHaveBeenCalledWith(
      expect.objectContaining({ writeStrategy: 'directCreateWriteProbe' }),
    );
  });
});
