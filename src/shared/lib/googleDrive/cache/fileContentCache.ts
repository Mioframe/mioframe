import { LRUCache } from "lru-cache";

const MAX_FILE_SIZE = 100 * 1024;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

interface CacheEntry {
  file: File;
}

const fileCache = new LRUCache<string, CacheEntry>({
  max: 100,
  maxSize: MAX_TOTAL_SIZE,
  sizeCalculation: (entry) => entry.file.size,
  allowStale: false,
});

export class FileContentCache {
  get(fileId: string, modifiedTime: string): File | undefined {
    const key = this.generateKey(fileId, modifiedTime);
    const entry = fileCache.get(key);

    if (!entry) return undefined;

    return entry.file;
  }

  set(fileId: string, modifiedTime: string, file: File): boolean {
    if (file.size > MAX_FILE_SIZE) {
      return false;
    }

    const key = this.generateKey(fileId, modifiedTime);

    fileCache.set(key, { file });

    return true;
  }

  invalidate(fileId: string): void {
    const keysToDelete: string[] = [];

    for (const key of fileCache.keys()) {
      if (key.startsWith(`${fileId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      fileCache.delete(key);
    }
  }

  clear(): void {
    fileCache.clear();
  }

  private generateKey(fileId: string, modifiedTime: string): string {
    return `${fileId}:${modifiedTime}`;
  }
}

export const fileContentCache = new FileContentCache();
