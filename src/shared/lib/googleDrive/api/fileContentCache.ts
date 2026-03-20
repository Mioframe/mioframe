import { LRUCache } from 'lru-cache';

const MAX_FILE_SIZE = 100 * 1024;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

interface CacheEntry {
  file: File;
  modifiedTime: string;
}

const fileCache = new LRUCache<string, CacheEntry>({
  max: 100,
  maxSize: MAX_TOTAL_SIZE,
  sizeCalculation: (entry) => entry.file.size,
  allowStale: false,
});

export class FileContentCache {
  get(fileId: string): CacheEntry | undefined {
    return fileCache.get(fileId);
  }

  set(fileId: string, file: File, modifiedTime: string): boolean {
    if (file.size > MAX_FILE_SIZE) {
      return false;
    }

    fileCache.set(fileId, { file, modifiedTime });

    return true;
  }

  invalidate(fileId: string): void {
    fileCache.delete(fileId);
  }

  clear(): void {
    fileCache.clear();
  }
}

export const fileContentCache = new FileContentCache();
