import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFileHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';
import { DomainError } from '@shared/lib/error';
import { FileSystemDomainErrorCode } from './fileSystemErrorCode';

const { fileSaveMock } = vi.hoisted(() => ({
  fileSaveMock: vi.fn(),
}));

vi.mock('browser-fs-access', () => ({
  fileSave: fileSaveMock,
}));

describe('saveFileWithPicker', () => {
  const hadOriginalShowSaveFilePicker = Reflect.has(globalThis, 'showSaveFilePicker');
  const originalShowSaveFilePicker = globalThis.showSaveFilePicker;

  beforeEach(() => {
    fileSaveMock.mockReset();
    Reflect.deleteProperty(globalThis, 'showSaveFilePicker');
  });

  afterEach(() => {
    if (hadOriginalShowSaveFilePicker) {
      Reflect.set(globalThis, 'showSaveFilePicker', originalShowSaveFilePicker);
      return;
    }

    Reflect.deleteProperty(globalThis, 'showSaveFilePicker');
  });

  it('starts the native save picker before asynchronous content preparation', async () => {
    const events: string[] = [];
    let resolveContent!: (blob: Blob) => void;
    const contentPromise = new Promise<Blob>((resolve) => {
      resolveContent = resolve;
    });
    const writable = {
      locked: false,
      write: vi.fn(async (blob: Blob) => {
        events.push(`write:${await blob.text()}`);
      }),
      close: vi.fn(() => {
        events.push('close');
        return Promise.resolve(undefined);
      }),
      abort: vi.fn(() => {
        events.push('abort');
        return Promise.resolve(undefined);
      }),
      seek: vi.fn(() => Promise.resolve(undefined)),
      truncate: vi.fn(() => Promise.resolve(undefined)),
      getWriter: () => new WritableStream().getWriter(),
    } satisfies FileSystemWritableFileStream;
    const showSaveFilePickerMock = vi.fn(() => {
      events.push('picker');
      const handle = createFileHandleMock({ name: 'doc.json' });
      handle.createWritable = vi.fn(() => Promise.resolve(writable));
      return Promise.resolve(handle);
    });
    Reflect.set(globalThis, 'showSaveFilePicker', showSaveFilePickerMock);

    const { saveFileWithPicker } = await import('./saveFileWithPicker');

    const savePromise = saveFileWithPicker(
      async () => {
        events.push('prepare');
        return contentPromise;
      },
      {
        fileName: 'doc.json',
        extensions: ['.json'],
        mimeTypes: ['application/json'],
      },
    );

    await Promise.resolve();
    expect(events).toEqual(['picker']);

    resolveContent(new Blob(['{"name":"Doc"}'], { type: 'application/json' }));

    await expect(savePromise).resolves.toBe(true);
    expect(events).toEqual(['picker', 'prepare', 'write:{"name":"Doc"}', 'close']);
    expect(writable.abort).not.toHaveBeenCalled();
  });

  it('uses browser-fs-access fallback when the native save picker is unavailable', async () => {
    fileSaveMock.mockResolvedValueOnce(null);

    const { saveFileWithPicker } = await import('./saveFileWithPicker');

    await expect(
      saveFileWithPicker(
        () => Promise.resolve(new Blob(['fallback'], { type: 'application/json' })),
        {
          fileName: 'doc.json',
          extensions: ['.json'],
          mimeTypes: ['application/json'],
        },
      ),
    ).resolves.toBe(true);

    expect(fileSaveMock).toHaveBeenCalledOnce();
    const [blobPromise, options] = fileSaveMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      fileName: 'doc.json',
      extensions: ['.json'],
      mimeTypes: ['application/json'],
    });
    await expect((await blobPromise).text()).resolves.toBe('fallback');
  });

  it('returns false when the user cancels the native save picker', async () => {
    Reflect.set(
      globalThis,
      'showSaveFilePicker',
      vi.fn(() => Promise.reject(new DOMException('User cancelled', 'AbortError'))),
    );

    const { saveFileWithPicker } = await import('./saveFileWithPicker');

    await expect(
      saveFileWithPicker(() => Promise.resolve(new Blob(['{}'], { type: 'application/json' })), {
        fileName: 'doc.json',
        extensions: ['.json'],
        mimeTypes: ['application/json'],
      }),
    ).resolves.toBe(false);
  });

  it('aborts the writable and preserves the original content error on the native path', async () => {
    const rawCause = new Error('document fetch failed');
    const writable = {
      locked: false,
      write: vi.fn(),
      close: vi.fn(),
      abort: vi.fn(() => Promise.resolve(undefined)),
      seek: vi.fn(() => Promise.resolve(undefined)),
      truncate: vi.fn(() => Promise.resolve(undefined)),
      getWriter: () => new WritableStream().getWriter(),
    } satisfies FileSystemWritableFileStream;
    Reflect.set(
      globalThis,
      'showSaveFilePicker',
      vi.fn(() => {
        const handle = createFileHandleMock({ name: 'doc.json' });
        handle.createWritable = vi.fn(() => Promise.resolve(writable));
        return Promise.resolve(handle);
      }),
    );

    const { saveFileWithPicker } = await import('./saveFileWithPicker');

    await expect(
      saveFileWithPicker(() => Promise.reject(rawCause), {
        fileName: 'doc.json',
        extensions: ['.json'],
        mimeTypes: ['application/json'],
      }),
    ).rejects.toBe(rawCause);

    expect(writable.abort).toHaveBeenCalledOnce();
    expect(writable.write).not.toHaveBeenCalled();
    expect(writable.close).not.toHaveBeenCalled();
  });
});

describe('saveStreamWithPicker', () => {
  const hadOriginalShowSaveFilePicker = Reflect.has(globalThis, 'showSaveFilePicker');
  const originalShowSaveFilePicker = globalThis.showSaveFilePicker;

  beforeEach(() => {
    fileSaveMock.mockReset();
    Reflect.deleteProperty(globalThis, 'showSaveFilePicker');
  });

  afterEach(() => {
    if (hadOriginalShowSaveFilePicker) {
      Reflect.set(globalThis, 'showSaveFilePicker', originalShowSaveFilePicker);
      return;
    }

    Reflect.deleteProperty(globalThis, 'showSaveFilePicker');
  });

  it('writes each produced chunk straight to the writable as it is produced, on the native path', async () => {
    const writes: string[] = [];
    const writable = {
      locked: false,
      write: vi.fn((chunk: FileSystemWriteChunkType) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- test-only narrowing of the union chunk type this suite always passes as Uint8Array
        writes.push(new TextDecoder().decode(chunk as Uint8Array));
        return Promise.resolve();
      }),
      close: vi.fn(() => Promise.resolve(undefined)),
      abort: vi.fn(() => Promise.resolve(undefined)),
      seek: vi.fn(() => Promise.resolve(undefined)),
      truncate: vi.fn(() => Promise.resolve(undefined)),
      getWriter: () => new WritableStream().getWriter(),
    } satisfies FileSystemWritableFileStream;
    Reflect.set(
      globalThis,
      'showSaveFilePicker',
      vi.fn(() => {
        const handle = createFileHandleMock({ name: 'archive.zip' });
        handle.createWritable = vi.fn(() => Promise.resolve(writable));
        return Promise.resolve(handle);
      }),
    );

    const { saveStreamWithPicker } = await import('./saveFileWithPicker');

    const result = await saveStreamWithPicker(
      async (write) => {
        await write(new TextEncoder().encode('chunk-1'));
        await write(new TextEncoder().encode('chunk-2'));
      },
      {
        fileName: 'archive.zip',
        extensions: ['.zip'],
        mimeTypes: ['application/zip'],
        maxFallbackBytes: 1024,
      },
    );

    expect(result).toBe(true);
    expect(writes).toEqual(['chunk-1', 'chunk-2']);
    expect(writable.close).toHaveBeenCalledOnce();
    expect(writable.abort).not.toHaveBeenCalled();
  });

  it('aborts the writable and preserves the original error when a chunk write fails on the native path', async () => {
    const produceError = new Error('read failed mid-stream');
    const writable = {
      locked: false,
      write: vi.fn(),
      close: vi.fn(),
      abort: vi.fn(() => Promise.resolve(undefined)),
      seek: vi.fn(() => Promise.resolve(undefined)),
      truncate: vi.fn(() => Promise.resolve(undefined)),
      getWriter: () => new WritableStream().getWriter(),
    } satisfies FileSystemWritableFileStream;
    Reflect.set(
      globalThis,
      'showSaveFilePicker',
      vi.fn(() => {
        const handle = createFileHandleMock({ name: 'archive.zip' });
        handle.createWritable = vi.fn(() => Promise.resolve(writable));
        return Promise.resolve(handle);
      }),
    );

    const { saveStreamWithPicker } = await import('./saveFileWithPicker');

    await expect(
      saveStreamWithPicker(
        () => {
          throw produceError;
        },
        {
          fileName: 'archive.zip',
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
          maxFallbackBytes: 1024,
        },
      ),
    ).rejects.toBe(produceError);

    expect(writable.abort).toHaveBeenCalledOnce();
    expect(writable.close).not.toHaveBeenCalled();
  });

  it('buffers chunks into one Blob for the browser-fs-access fallback path', async () => {
    fileSaveMock.mockResolvedValueOnce(null);

    const { saveStreamWithPicker } = await import('./saveFileWithPicker');

    const result = await saveStreamWithPicker(
      async (write) => {
        await write(new TextEncoder().encode('fall'));
        await write(new TextEncoder().encode('back'));
      },
      {
        fileName: 'archive.zip',
        extensions: ['.zip'],
        mimeTypes: ['application/zip'],
        maxFallbackBytes: 1024,
      },
    );

    expect(result).toBe(true);
    expect(fileSaveMock).toHaveBeenCalledOnce();
    const [blob, options] = fileSaveMock.mock.calls[0] ?? [];
    expect(options).toMatchObject({ fileName: 'archive.zip' });
    expect(blob).toBeInstanceOf(Blob);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrowed by the toBeInstanceOf assertion above
    await expect((blob as Blob).text()).resolves.toBe('fallback');
  });

  it('throws a bounded DomainError on the fallback path once buffered bytes exceed the limit', async () => {
    const { saveStreamWithPicker } = await import('./saveFileWithPicker');

    let caught: unknown;
    try {
      await saveStreamWithPicker(
        async (write) => {
          await write(new TextEncoder().encode('a'.repeat(10)));
          await write(new TextEncoder().encode('b'.repeat(10)));
        },
        {
          fileName: 'archive.zip',
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
          maxFallbackBytes: 15,
        },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: FileSystemDomainErrorCode.saveStreamFallbackTooLarge });
    expect(fileSaveMock).not.toHaveBeenCalled();
  });

  it('returns false when the user cancels the native save picker', async () => {
    Reflect.set(
      globalThis,
      'showSaveFilePicker',
      vi.fn(() => Promise.reject(new DOMException('User cancelled', 'AbortError'))),
    );

    const { saveStreamWithPicker } = await import('./saveFileWithPicker');

    await expect(
      saveStreamWithPicker(() => Promise.resolve(), {
        fileName: 'archive.zip',
        extensions: ['.zip'],
        mimeTypes: ['application/zip'],
        maxFallbackBytes: 1024,
      }),
    ).resolves.toBe(false);
  });
});
