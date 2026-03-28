import { dayjs } from '@shared/lib/dayjs';
import type { Options as KyOptions, Progress } from 'ky';
import { z } from 'zod/v4-mini';
import { HttpStatusCode } from '../../error/httpStatus';

/**
 * Google Drive space types.
 *
 * Represents the different storage spaces available in Google Drive API.
 * - `drive`: Main user storage ("My Drive")
 * - `appDataFolder`: Hidden space for application-specific data
 */
export enum SPACE {
  /** Main user storage space ("My Drive") */
  drive = 'drive',
  /** Hidden space for application-specific data */
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

/**
 * Parameters for listing Google Drive files.
 */
export interface ListParams {
  /** Number of files per page. Default: 1000 */
  pageSize?: number;
  /** Pagination token for retrieving the next page. Default: '' */
  pageToken?: string;
  /** Structured search query parameters. Default: `{}` */
  q?: {
    /** File name to search for (exact match). */
    name?: string;
    /** Whether to search in "Shared with me" space. */
    sharedWithMe?: boolean;
    /** Whether to include trashed items. */
    trashed?: boolean;
    /** Parent folder ID to search within. */
    parentId?: string;
  };
  /** Spaces to search: `['drive']` or `['appDataFolder']`. Default: `[]` */
  spaces?: SPACE[];
  /** Automatically fetch all result pages. Default: `false` */
  fetchAll?: boolean;
  /** Fields to sample via JSON Path. Default: `nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,parents,capabilities(canTrash))`
   * Important: All added fields must be included in the Zod schema (GDriveFile), otherwise they will be filtered out */
  fields?: string;
}

/**
 * Parameters for updating file metadata.
 */
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

/**
 * Parameters for downloading file content.
 */
export interface DownloadParams {
  /** Download progress callback function. Optional */
  onDownloadProgress?: (progress: Progress, chunk: Uint8Array) => void;
}

/**
 * Resource object for creating a new file in Google Drive.
 */
export interface CreateResource {
  /** File name */
  name: string;
  /** File MIME type. Optional */
  mimeType?: string;
  /** Array of parent folder IDs (required) */
  readonly parents: readonly string[];
}

/**
 * Zod schema for Google Drive API error response parsing.
 * Parses the `error` object from Google Drive API responses and maps codes to HttpStatusCode enum.
 */
export const zodGoogleErrorResponse = z.object({
  error: z.object({
    message: z.string(),
    code: z.enum(HttpStatusCode),
    location: z.optional(z.string()),
    reason: z.optional(z.string()),
  }),
});

export type GoogleErrorResponse = z.output<typeof zodGoogleErrorResponse>;

/**
 * API request settings with deduplication support.
 * Extends KyOptions with additional configuration for request deduplication.
 */
export interface ApiOptions extends KyOptions {
  /**
   * When enabled, prevents sending identical requests simultaneously.
   * @default false
   */
  dedupe?: boolean;
}

/**
 * Zod schema для парсинга ответа Google Drive API v3 при получении метаданных файла.
 * Источник данных: https://developers.google.com/drive/api/v3/reference/files/get
 * Схема валидирует и преобразует объект `files[0]` из списка файлов или отдельного запроса к файлу.
 */
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

/**
 * Zod schema for parsing Google Drive API list response.
 * Represents the response structure from `files` endpoint with optional pagination token.
 */
export const zodGDriveListResponse = z.object({
  files: z.optional(z.array(zodGDriveFileMeta)),
  nextPageToken: z.optional(z.string()),
});

/**
 * Google Drive list response type.
 * Contains array of file metadata and optional pagination token for fetching next page.
 */
export type GDriveListResponse = z.output<typeof zodGDriveListResponse>;
