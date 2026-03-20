import { dayjs } from '@shared/lib/dayjs';
import type { Options as KyOptions, Progress } from 'ky';
import { z } from 'zod/v4-mini';

/**
 * Google Drive space types.
 */
export enum SPACE {
  drive = 'drive',
  appDataFolder = 'appDataFolder',
}

/**
 * Authentication parameters for Google Drive API requests.
 * @property ACCESS_TOKEN - required OAuth2 access token
 * @property API_KEY - optional API key for additional requests
 */
export interface GoogleAuthParams {
  API_KEY?: string;
  ACCESS_TOKEN: string;
}

export interface ListParams {
  /** Number of files per page. Default: 1000 */
  pageSize?: number;
  /** Pagination token for retrieving the next page. Default: '' */
  pageToken?: string;
  /** Search query (e.g., "name contains 'report'"). Default: '' */
  q?: string;
  /** Spaces to search: `['drive']` or `['appDataFolder']`. Default: `[]` */
  spaces?: SPACE[];
  /** Automatically fetch all result pages. Default: `false` */
  fetchAll?: boolean;
  /** Fields to sample via JSON Path. Default: `nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,parents,capabilities(canTrash))`
   * Important: All added fields must be included in the Zod schema (GDriveFile), otherwise they will be filtered out */
  fields?: string;
}

export interface UpdateParams {
  /** New file name. Optional */
  name?: string;
  /** Files/folders to add to the parent list. Optional */
  addParents?: string[];
  /** Files/folders to remove from the parent list. Optional */
  removeParents?: string[];
  /** Move file to trash (`true`) or restore (`false`). Optional */
  trashed?: boolean;
}

export interface DownloadParams {
  /** Download progress callback function. Optional */
  onDownloadProgress?: (progress: Progress, chunk: Uint8Array) => void;
}

export interface CreateResource {
  /** File name */
  name: string;
  /** File MIME type. Optional */
  mimeType?: string;
  /** Array of parent folder IDs (required) */
  readonly parents: readonly string[];
}

export const zodGoogleErrorResponse = z.object({
  error: z.object({
    message: z.string(),
  }),
});

/**
 * API request settings with deduplication support.
 * @extends KyOptions
 */
export interface ApiOptions extends KyOptions {
  /**
   * When enabled, prevents sending identical requests simultaneously.
   * @default false
   */
  dedupe?: boolean;
}

// Схемы данных
export const zodGDriveFileMeta = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.optional(z.string()),
  createdTime: z.optional(z.string()),
  modifiedTime: z._default(z.string(), () => dayjs().toISOString()),
  parents: z.optional(z.array(z.string())),
  capabilities: z.optional(
    z.object({
      canTrash: z.optional(z.boolean()),
    }),
  ),
});

/**
 * Google Drive file type extracted from validation schema.
 * Contains main file fields: id, name, mimeType, size, timestamps, parents, and capabilities.
 */
export type GDriveFileMeta = z.output<typeof zodGDriveFileMeta>;

export const zodGDriveListResponse = z.object({
  files: z.optional(z.array(zodGDriveFileMeta)),
  nextPageToken: z.optional(z.string()),
});

export type GDriveListResponse = z.output<typeof zodGDriveListResponse>;
