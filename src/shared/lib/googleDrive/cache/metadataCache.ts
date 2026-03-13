import { LRUCache } from 'lru-cache';
import type { GDriveFile } from '../simplifiedAPI';

interface ListCacheEntry {
  value: { files: GDriveFile[]; nextPageToken?: string };
}

const DEFAULT_TTL_MS = 30_000;

const listCache = new LRUCache<string, ListCacheEntry>({
  max: 500,
  ttl: DEFAULT_TTL_MS,
});

export class MetadataCache {
  getList(
    key: string,
  ): { files: GDriveFile[]; nextPageToken?: string } | undefined {
    const entry = listCache.get(key);
    if (!entry) return undefined;

    return entry.value;
  }

  setList(
    key: string,
    value: { files: GDriveFile[]; nextPageToken?: string },
  ): void {
    listCache.set(key, { value });
  }

  invalidateByFolderId(folderId: string): void {
    const searchPattern = `'${folderId}' in parents`;
    for (const key of listCache.keys()) {
      if (key.includes(searchPattern)) {
        listCache.delete(key);
      }
    }
  }

  clear(): void {
    listCache.clear();
  }
}

export const metadataCache = new MetadataCache();
