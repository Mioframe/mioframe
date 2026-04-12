import { afterEach, describe, expect, it } from 'vitest';
import { isFileSystemDirectoryHandle } from './isFileSystemDirectoryHandle';

const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'FileSystemDirectoryHandle');

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(globalThis, 'FileSystemDirectoryHandle', originalDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, 'FileSystemDirectoryHandle');
});

describe('isFileSystemDirectoryHandle', () => {
  it('returns false when the runtime does not expose FileSystemDirectoryHandle', () => {
    Reflect.deleteProperty(globalThis, 'FileSystemDirectoryHandle');

    expect(isFileSystemDirectoryHandle({ name: 'Projects' })).toBe(false);
  });

  it('uses the runtime constructor only when it exists', () => {
    class FakeFileSystemDirectoryHandle {
      readonly kind = 'directory';
    }

    Object.defineProperty(globalThis, 'FileSystemDirectoryHandle', {
      value: FakeFileSystemDirectoryHandle,
      configurable: true,
      writable: true,
    });

    expect(isFileSystemDirectoryHandle(new FakeFileSystemDirectoryHandle())).toBe(true);
    expect(isFileSystemDirectoryHandle({ name: 'Projects' })).toBe(false);
  });
});
