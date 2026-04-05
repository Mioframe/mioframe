import { describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import {
  FSNodeType,
  VfsEventSource,
  VfsEventType,
} from '@shared/lib/virtualFileSystem';
import { googleDriveFileSystemProvider } from './googleDriveFileSystemProvider';

describe('googleDriveFileSystemProvider', () => {
  it('reads the root directory from reactive sessions', async () => {
    const sessions$ = new BehaviorSubject<string[]>(['user@example.com']);
    const provider = googleDriveFileSystemProvider({
      $sessions: sessions$,
      requestToken: vi.fn(),
    });

    const entries = await provider.readDirectory('/');

    expect(entries).toEqual([
      [
        'user@example.com',
        {
          capabilities: {
            canChangePath: false,
            canDelete: false,
            canEditChildren: false,
          },
          type: FSNodeType.Directory,
        },
      ],
    ]);
  });

  it('emits a provider event when sessions change after initialization', async () => {
    const sessions$ = new BehaviorSubject<string[]>([]);
    const provider = googleDriveFileSystemProvider({
      $sessions: sessions$,
      requestToken: vi.fn(),
    });
    const onEvent = vi.fn();

    const unsubscribe = provider.watch(onEvent);

    await Promise.resolve();

    expect(onEvent).not.toHaveBeenCalled();

    sessions$.next(['user@example.com']);

    expect(onEvent).toHaveBeenCalledWith({
      source: VfsEventSource.PROVIDER,
      type: VfsEventType.UPDATE,
      path: '/',
      nodeType: FSNodeType.Directory,
    });

    unsubscribe();
  });
});
