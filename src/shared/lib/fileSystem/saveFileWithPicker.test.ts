import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFileHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';

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
