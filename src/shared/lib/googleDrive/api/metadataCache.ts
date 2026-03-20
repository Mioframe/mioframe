import { LRUCache } from 'lru-cache';
import type { GDriveListResponse } from '.';

const DEFAULT_TTL_MS = 30_000;

export class MetadataCache {
  listCache = new LRUCache<string, GDriveListResponse>({
    max: 500,
    ttl: DEFAULT_TTL_MS,
  });

  getList(key: string): GDriveListResponse | undefined {
    return this.listCache.get(key);
  }

  setList(key: string, listResponse: GDriveListResponse): void {
    this.listCache.set(key, listResponse);
  }

  invalidateByFolderId(folderId: string): void {
    const searchPatterns =
      folderId === 'sharedWithMe'
        ? ['sharedWithMe = true']
        : [`'${folderId}' in parents`];

    const keysToDelete: string[] = [];

    for (const key of this.listCache.keys()) {
      if (searchPatterns.some((pattern) => key.includes(pattern))) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.listCache.delete(key);
    }
  }

  clear(): void {
    this.listCache.clear();
  }
}

export const metadataCache = new MetadataCache();
