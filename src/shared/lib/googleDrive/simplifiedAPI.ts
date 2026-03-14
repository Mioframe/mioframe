import { toMerged } from 'es-toolkit';
import { fileTypeFromBuffer } from 'file-type';
import type { Input, Options as KyOptions, Progress } from 'ky';
import ky, { HTTPError } from 'ky';
import type { ZodMiniType } from 'zod/v4-mini';
import { z } from 'zod/v4-mini';
import stringify from 'safe-stable-stringify';
import { DomainError } from '../error';
import { metadataCache } from './cache/metadataCache';
import { fileContentCache } from './cache/fileContentCache';
import { dedupe } from './cache/dedupe';

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

interface ListParams {
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

interface UpdateParams {
  /** New file name. Optional */
  name?: string;
  /** Files/folders to add to the parent list. Optional */
  addParents?: string[];
  /** Files/folders to remove from the parent list. Optional */
  removeParents?: string[];
  /** Move file to trash (`true`) or restore (`false`). Optional */
  trashed?: boolean;
}

interface DownloadParams {
  /** File name for saving */
  name: string;
  /** Exact modification date for caching (ISO 8601). Optional */
  modifiedTime?: string;
  /** Download progress callback function. Optional */
  onDownloadProgress?: (progress: Progress, chunk: Uint8Array) => void;
}

interface CreateResource {
  /** File name */
  name: string;
  /** File MIME type. Optional */
  mimeType?: string;
  /** Array of parent folder IDs (required) */
  readonly parents: readonly string[];
}

const zodGoogleErrorResponse = z.object({
  error: z.object({
    message: z.string(),
  }),
});

// Configure client with retry for production
const apiClient = ky.create({
  retry: {
    limit: 3,
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace', 'patch'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: 30000,
});

/**
 * API request settings with deduplication support.
 * @extends KyOptions
 */
interface ApiOptions extends KyOptions {
  /**
   * When enabled, prevents sending identical requests simultaneously.
   * @default false
   */
  dedupe?: boolean;
}

const apiFetch = (url: Input, options?: KyOptions) => apiClient(url, options);

const dedupeApiFetch = dedupe(apiFetch);

/**
 * Internal request handler with error normalization.
 * Handles HTTP errors, Google API errors, and wraps them in DomainError.
 *
 * @param url - request URL
 * @param options - optional request options (method, headers, dedupe, etc.)
 * @returns {Promise<Response>} HTTP response
 * @throws {DomainError} If request fails or Google API returns an error
 */
const googleRequest = async (url: Input, options?: ApiOptions) => {
  try {
    const response = options?.dedupe
      ? await dedupeApiFetch(url, options)
      : await apiFetch(url, options);

    if (!response.ok) {
      const { data: googleError } = zodGoogleErrorResponse.safeParse(
        await response.json(),
      );

      throw new DomainError(googleError?.error.message || response.statusText);
    }

    return response;
  } catch (e) {
    if (e instanceof HTTPError) {
      const errorBody = await e.response.json().catch(() => ({}));
      const { data: googleError } = zodGoogleErrorResponse.safeParse(errorBody);

      throw new DomainError(googleError?.error.message || e.message, {
        cause: e,
      });
    }

    throw e;
  }
};

/**
 * Internal request handler with authentication and response validation.
 * Wraps authenticated requests with Bearer token and validates response against schema.
 *
 * @template R - response data type
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param url - request URL (must start with https://)
 * @param auth - authentication parameters with ACCESS_TOKEN and optional API_KEY
 * @param options - optional request options
 * @param responseSchema - Zod schema for response validation
 * @returns {Promise<{ result: R }>} validated response data
 * @throws {DomainError} If request fails, response is invalid, or parsing fails
 */
const authorizedRequest = async <R>(
  method: Required<KyOptions['method']>,
  url: `https://${string}`,
  { ACCESS_TOKEN, API_KEY }: GoogleAuthParams,
  options: ApiOptions = {},
  responseSchema: ZodMiniType<R>,
) => {
  const response = await (
    await googleRequest(
      url,
      toMerged(
        {
          method,
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
          searchParams: {
            key: API_KEY,
          },
        },
        options,
      ),
    )
  ).json();

  // Use safeParse to catch parsing errors and wrap them in DomainError
  const parsed = responseSchema.safeParse(response);
  if (!parsed.success) {
    throw new DomainError('Failed to parse API response', {
      cause: new Error(`Invalid response format: ${JSON.stringify(response)}`),
    });
  }

  return { result: parsed.data };
};

// Схемы данных
const zodGDriveFile = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.optional(z.string()),
  createdTime: z.optional(z.string()),
  modifiedTime: z.optional(z.string()),
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
export type GDriveFile = z.output<typeof zodGDriveFile>;

const listResponseSchema = z.object({
  files: z.optional(z.array(zodGDriveFile)),
  nextPageToken: z.optional(z.string()),
});

/**
 * Retrieves a list of Google Drive files with caching and request deduplication support.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param params - list request parameters (ListParams)
 * @returns `Promise<{ result: { files?: GDriveFile[], nextPageToken?: string } }>`
 * @example
 * // Get 100 files from root
 * const { result: { files } } = await simplifiedGoogleDriveAPI.list(
 *   { ACCESS_TOKEN: 'your-token' },
 *   { pageSize: 100 }
 * );
 *
 * @example
 * // Get all files with search
 * const { result: { files } } = await simplifiedGoogleDriveAPI.list(
 *   { ACCESS_TOKEN: 'your-token' },
 *   { q: "name contains 'report'", fetchAll: true }
 * );
 *
 * @example
 * // Get files from a specific folder
 * const { result: { files } } = await simplifiedGoogleDriveAPI.list(
 *   { ACCESS_TOKEN: 'your-token' },
 *   { q: "'folder-id' in parents" }
 * );
 *
 * @throws {DomainError} If API request fails or response is invalid
 */
const list = async (
  auth: GoogleAuthParams,
  {
    pageSize = 1000,
    pageToken = '',
    q = '',
    spaces = [],
    fetchAll = false,
    fields = 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,parents,capabilities(canTrash))',
  }: ListParams,
) => {
  const cacheKey =
    stringify({
      pageSize,
      pageToken,
      q,
      spaces,
      fetchAll,
      fields,
    }) || 'default-cache-key';

  const cached = metadataCache.getList(cacheKey);
  if (cached) {
    return { result: cached };
  }

  const fetchPage = async (pageToken: string) =>
    authorizedRequest(
      'get',
      'https://www.googleapis.com/drive/v3/files',
      auth,
      {
        searchParams: {
          pageSize,
          pageToken,
          q,
          spaces: spaces.join(','),
          fields,
        },
        dedupe: true,
      },
      listResponseSchema,
    );

  let result;
  if (!fetchAll) {
    result = await fetchPage(pageToken);
  } else {
    let currentPageToken = pageToken;
    const allFiles: GDriveFile[] = [];

    do {
      const pageResult = await fetchPage(currentPageToken);
      if (pageResult.result.files) {
        allFiles.push(...pageResult.result.files);
      }
      currentPageToken = pageResult.result.nextPageToken ?? '';
    } while (currentPageToken);

    result = {
      result: {
        files: allFiles,
        nextPageToken: undefined,
      },
    };

    // Cache the final result for fetchAll mode
    if (allFiles.length > 0) {
      metadataCache.setList(cacheKey, {
        files: allFiles,
        nextPageToken: undefined,
      });
    }
  }

  // Cache the result for non-fetchAll mode
  if (result.result.files) {
    metadataCache.setList(cacheKey, {
      files: result.result.files,
      nextPageToken: result.result.nextPageToken,
    });
  }

  return result;
};

/**
 * Updates file metadata (name, parents, trash status).
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param fileId - file identifier to update
 * @param options - update parameters (UpdateParams)
 * @returns `{ result: {} }` with empty update result
 * @example
 * // Rename file
 * await simplifiedGoogleDriveAPI.update(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { name: 'new-name.pdf' }
 * );
 *
 * @example
 * // Move file to trash
 * await simplifiedGoogleDriveAPI.update(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { trashed: true }
 * );
 *
 * @example
 * // Restore file from trash
 * await simplifiedGoogleDriveAPI.update(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { trashed: false }
 * );
 *
 * @example
 * // Add parents and move to trash
 * await simplifiedGoogleDriveAPI.update(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   {
 *     addParents: ['parent-id-1', 'parent-id-2'],
 *     trashed: true
 *   }
 * );
 *
 * @throws {DomainError} If API request fails or response is invalid
 */
const update = (
  auth: GoogleAuthParams,
  fileId: string,
  { name, addParents, removeParents, trashed }: UpdateParams,
) => {
  const result = authorizedRequest(
    'patch',
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    auth,
    {
      searchParams: {
        ...(addParents?.length ? { addParents: addParents.join(',') } : {}),
        ...(removeParents?.length
          ? { removeParents: removeParents.join(',') }
          : {}),
      },
      json: {
        name,
        trashed,
      },
    },
    z.object({}),
  );

  // Invalidate cache for parent folders if parents were modified
  if (addParents?.length || removeParents?.length) {
    const parentIds = new Set([
      ...(addParents ?? []),
      ...(removeParents ?? []),
    ]);
    for (const parentId of parentIds) {
      metadataCache.invalidateByFolderId(parentId);
    }
  }

  return result;
};

/**
 * Downloads file content as a File object.
 * Checks content cache first, returns cached File if available with matching modification time.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param fileId - file identifier to download
 * @param params - download parameters (DownloadParams)
 * @returns `File` object with file content
 * @example
 * // Download file
 * const file = await simplifiedGoogleDriveAPI.download(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { name: 'report.pdf' }
 * );
 *
 * @example
 * // Download with progress tracking
 * const file = await simplifiedGoogleDriveAPI.download(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   {
 *     name: 'report.pdf',
 *     onDownloadProgress: (progress, chunk) => {
 *       console.log(`Progress: ${progress.transferredBytes}/${progress.totalBytes}`);
 *     }
 *   }
 * );
 *
 * @throws {DomainError} If API request fails (authorization error, rate limits, invalid response)
 * @throws {Error} If a network error occurs or timeout expires (wrapped in DomainError)
 */
const download = async (
  auth: GoogleAuthParams,
  fileId: string,
  { name, modifiedTime, onDownloadProgress }: DownloadParams,
): Promise<File> => {
  if (modifiedTime) {
    const cached = fileContentCache.get(fileId, modifiedTime);
    if (cached) {
      return cached;
    }
  }

  const makeRequest = async () =>
    (
      await googleRequest(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'get',
          headers: {
            Authorization: `Bearer ${auth.ACCESS_TOKEN}`,
          },
          searchParams: {
            alt: 'media',
          },
          onDownloadProgress,
          dedupe: true,
        },
      )
    )
      .blob()
      .then(
        (blob) =>
          new File([blob], name, {
            type: blob.type,
          }),
      );

  const file = await makeRequest();

  if (modifiedTime) {
    fileContentCache.set(fileId, modifiedTime, file);
  }

  return file;
};
/**
 * Creates a new file in Google Drive.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param resource - file creation parameters (CreateResource)
 * @returns `{ result: { id: string } }` - new file ID
 * @example
 * // Create file in root
 * const { result: { id: fileId } } = await simplifiedGoogleDriveAPI.create(
 *   { ACCESS_TOKEN: 'your-token' },
 *   {
 *     name: 'new-file.txt',
 *     mimeType: 'text/plain',
 *     parents: ['root-id'],
 *   }
 * );
 *
 * @throws {DomainError} If API request fails, response is invalid, or parents array is empty (synchronously)
 */
const create = (auth: GoogleAuthParams, resource: CreateResource) => {
  if (resource.parents.length === 0) {
    throw new DomainError('Parents array cannot be empty');
  }

  const result = authorizedRequest(
    'post',
    'https://www.googleapis.com/drive/v3/files',
    auth,
    {
      json: resource,
    },
    z.object({ id: z.string() }),
  );

  // Invalidate cache for parent folder after file creation
  const parentId =
    resource.parents.length > 0 ? resource.parents[0] : undefined;
  if (parentId !== undefined) {
    metadataCache.invalidateByFolderId(parentId);
  }

  return result;
};

/**
 * Uploads content to an existing Google Drive file.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param fileId - file identifier to upload to
 * @param file - data to upload (string, Blob, ArrayBuffer, or ArrayBufferView)
 * @param onUploadProgress - optional upload progress callback
 * @returns `Response` object from ky
 * @example
 * // Upload Blob
 * await simplifiedGoogleDriveAPI.upload(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   myBlob
 * );
 *
 * @example
 * // Upload string
 * await simplifiedGoogleDriveAPI.upload(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   'content'
 * );
 *
 * @example
 * // Upload with progress tracking
 * await simplifiedGoogleDriveAPI.upload(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   myBlob,
 *   (progress, chunk) => {
 *     console.log(`Upload progress: ${progress.transferredBytes}/${progress.totalBytes}`);
 *   }
 * );
 *
 * @throws {DomainError} If API request fails or response is invalid
 * @throws {Error} If the provided file has an unsupported type
 */
const upload = async (
  auth: GoogleAuthParams,
  fileId: string,
  file: FileSystemWriteChunkType,
  onUploadProgress?: (progress: Progress, chunk: Uint8Array) => void,
): Promise<Response> => {
  let body: Blob;

  if (typeof file === 'string') {
    body = new Blob([file], { type: 'text/plain' });
  } else if (file instanceof Blob) {
    body = file;
  } else if (file instanceof ArrayBuffer || ArrayBuffer.isView(file)) {
    const buffer =
      file instanceof ArrayBuffer
        ? new Uint8Array(file)
        : new Uint8Array(file.buffer);
    const mimeTypeInfo = await fileTypeFromBuffer(buffer);
    const contentType = mimeTypeInfo
      ? mimeTypeInfo.mime
      : 'application/octet-stream';
    body = new Blob([buffer], { type: contentType });
  } else {
    throw new Error('Unsupported file type');
  }

  const response = await googleRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': body.type,
        'Content-Length': body.size.toString(),
        Authorization: `Bearer ${auth.ACCESS_TOKEN}`,
      },
      searchParams: {
        uploadType: 'media',
        fields: ['id', 'version', 'name'].join(','),
      },
      body,
      onUploadProgress,
    },
  );

  return response;
};

/**
 * Clears the content cache for a specific file.
 *
 * @param fileId - file identifier to clear cache for
 * @returns {void}
 * @example
 * simplifiedGoogleDriveAPI.invalidateFileContent('file-id');
 */
const invalidateFileContent = (fileId: string) => {
  fileContentCache.invalidate(fileId);
};

/**
 * Clears metadata cache for all files in a folder.
 *
 * @param folderId - folder identifier to clear cache for
 * @returns {void}
 * @example
 * simplifiedGoogleDriveAPI.invalidateFolderContents('folder-id');
 */
const invalidateFolderContents = (folderId: string) => {
  metadataCache.invalidateByFolderId(folderId);
};

/**
 * Clears all caches (metadata and content).
 *
 * @returns {void}
 * @example
 * simplifiedGoogleDriveAPI.clearCaches();
 */
const clearCaches = () => {
  metadataCache.clear();
  fileContentCache.clear();
};

/**
 * Public Google Drive API with caching and request deduplication support.
 *
 * @module simplifiedGoogleDriveAPI
 * @example
 * // List files
 * const { result: { files } } = await simplifiedGoogleDriveAPI.list(
 *   { ACCESS_TOKEN: 'your-token' },
 *   { pageSize: 100 }
 * );
 *
 * @example
 * // Download file
 * const file = await simplifiedGoogleDriveAPI.download(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { name: 'report.pdf' }
 * );
 *
 * @example
 * // Create new file
 * const { result: { id: fileId } } = await simplifiedGoogleDriveAPI.create(
 *   { ACCESS_TOKEN: 'your-token' },
 *   {
 *     name: 'new-file.txt',
 *     mimeType: 'text/plain',
 *     parents: ['root-id'],
 *   }
 * );
 */
export const simplifiedGoogleDriveAPI = {
  list,
  update,
  download,
  create,
  upload,
  invalidateFileContent,
  invalidateFolderContents,
  clearCaches,
};
