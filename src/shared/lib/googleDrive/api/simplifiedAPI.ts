import { toMerged } from 'es-toolkit';
import { fileTypeFromBuffer } from 'file-type';
import type { Input, Options as KyOptions, Progress } from 'ky';
import ky, { HTTPError } from 'ky';
import type { ZodMiniType } from 'zod/v4-mini';
import { z } from 'zod/v4-mini';
import { DomainError } from '../../error';
import { dedupe } from '../../dedupe';
import type {
  CreateResource,
  DownloadParams,
  GDriveFileMeta,
  GDriveListResponse,
  UpdateParams,
} from './types';
import {
  zodGDriveFileMeta,
  zodGDriveListResponse,
  zodGoogleErrorResponse,
  type ApiOptions,
  type GoogleAuthParams,
  type ListParams,
} from './types';
import { Cache } from '@shared/lib/cache';

/**
 * Configured ky client with retry logic for production resilience.
 * Retries on transient errors (408, 413, 429, 500-504) up to 3 attempts.
 */
const apiClient = ky.create({
  retry: {
    limit: 3,
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace', 'patch'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: 30000,
});

const apiFetch = (url: Input, options?: KyOptions) => apiClient(url, options);
const dedupeApiFetch = dedupe(apiFetch);

/**
 * Internal request handler with error normalization.
 * Handles HTTP errors and Google API errors, wrapping them in DomainError for consistent error handling.
 * Normalizes transient network errors and Google-specific API errors into a unified DomainError type.
 *
 * @param url - request URL
 * @param options - optional request options (method, headers, dedupe, etc.)
 * @returns {Promise<Response>} HTTP response
 * @throws {DomainError} If request fails or Google API returns an error with normalized message
 */
const googleRequest = async (
  url: Input,
  options?: ApiOptions,
): Promise<Response> => {
  try {
    const response = options?.dedupe
      ? await dedupeApiFetch(url, options)
      : await apiFetch(url, options);

    if (!response.ok) {
      const { data: googleError } = zodGoogleErrorResponse.safeParse(
        await response.clone().json(),
      );

      throw new DomainError(googleError?.error.message || response.statusText);
    }

    return response;
  } catch (e) {
    if (e instanceof HTTPError) {
      const errorBody = await e.response
        .clone()
        .json()
        .catch(() => ({}));
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
 * Handles both successful responses (validated via Zod schema) and error cases (HTTP errors, invalid JSON).
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
): Promise<{ result: R }> => {
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
  )
    .clone()
    .json();

  // Use safeParse to catch parsing errors and wrap them in DomainError
  const parsed = responseSchema.safeParse(response);
  if (!parsed.success) {
    throw new DomainError('Failed to parse API response', {
      cause: new Error(`Invalid response format: ${JSON.stringify(response)}`),
    });
  }

  return { result: parsed.data };
};

/**
 * LRU cache for paginated file metadata lists.
 * Stores complete list responses keyed by ListParams to avoid redundant API calls.
 * TTL: 30 seconds, max entries: 500.
 */
const gFileMetaListCache = new Cache<ListParams, GDriveListResponse>({
  max: 500,
  ttl: 30e3,
});

/**
 * Retrieves a list of Google Drive files with caching and request deduplication support.
 * Implements pagination for large result sets; when `fetchAll: true` automatically iterates through all pages.
 * Caches both individual file metadata and complete list responses to minimize API calls.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param params - list request parameters (ListParams)
 * @returns `Promise<{ result: GDriveListResponse }>` where `GDriveListResponse = { files?: GDriveFileMeta[], nextPageToken?: string }`
 * @example
 * // Get 100 files from root
 * const { result: { files, nextPageToken } } = await getGFileMetaList(
 *   { ACCESS_TOKEN: 'your-token' },
 *   { pageSize: 100 }
 * );
 
 * @example
 * // Get all files with search query
 * const { result: { files } } = await getGFileMetaList(
 *   { ACCESS_TOKEN: 'your-token' },
 *   { q: "name contains 'report'", fetchAll: true }
 * );
 
 * @example
 * // Get files from a specific folder by parent ID
 * const { result: { files } } = await getGFileMetaList(
 *   { ACCESS_TOKEN: 'your-token' },
 *   { q: "'folder-id' in parents" }
 * );
 
 * @throws {DomainError} If API request fails or response is invalid
 */
export const getGFileMetaList = async (
  auth: GoogleAuthParams,
  {
    pageSize = 1000,
    pageToken = '',
    q = '',
    spaces = [],
    fetchAll = true,
    fields = 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,parents,capabilities(canTrash))',
  }: ListParams,
) => {
  let result: GDriveListResponse | undefined = undefined;

  result = gFileMetaListCache.get({
    pageSize,
    pageToken,
    q,
    spaces,
    fetchAll,
    fields,
  });

  if (result) {
    return result;
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
      zodGDriveListResponse,
    );

  if (!fetchAll) {
    result = (await fetchPage(pageToken)).result;
  } else {
    let currentPageToken: string | undefined = pageToken;
    const allFiles: GDriveFileMeta[] = [];

    do {
      const pageResult = await fetchPage(currentPageToken);
      if (pageResult.result.files) {
        allFiles.push(...pageResult.result.files);
      }
      currentPageToken = pageResult.result.nextPageToken;
    } while (currentPageToken);

    result = {
      files: allFiles,
      nextPageToken: undefined,
    };
  }

  if (result.files?.length) {
    result.files.forEach((v) => {
      gFileMetaCache.set(v.id, v);
    });
    gFileMetaListCache.set(
      { pageSize, pageToken, q, spaces, fetchAll, fields },
      result,
    );
  }

  return result;
};

/**
 * LRU cache for individual file metadata.
 * Stores GDriveFileMeta keyed by fileId for O(1) lookups.
 * TTL: 30 seconds, max entries: 100.
 */
const gFileMetaCache = new Cache<string, GDriveFileMeta>({
  max: 100,
  ttl: 30e3,
});

/**
 * Invalidates cache entries for specified file IDs and dependent entries.
 * Removes records from all three caches (metadata, content, list), including dependent ones where fileId appears in `parents`.
 * Ensures cache consistency after mutations (create, update, delete) by removing stale entries.
 *
 * @param fileIdList - one or more file identifiers to remove from cache
 * @returns {void}
 * @example
 * // After updating or deleting a single file
 * await update({ ACCESS_TOKEN: token }, 'file-id', { name: 'new-name' });
 * invalidateCache('file-id');
 *
 * @example
 * // After creating a new folder (removing from cache all files that now have this folder in parents)
 * const newFolderId = await create(auth, { name: 'New Folder', mimeType: 'application/vnd.google-apps.folder', parents: ['root-id'] });
 * invalidateCache(newFolderId.result.id);
 */
const invalidateCache = (...fileIdList: string[]): void => {
  fileIdList.forEach((fileId) => {
    gFileMetaCache.delete(fileId);
    gDriveFileContentCache.delete(fileId);
    gFileMetaCache.forEach(({ parents }, key) => {
      if (parents?.includes(fileId)) {
        gFileMetaCache.delete(key);
      }
    });
    gFileMetaListCache.forEach(({ files }, key) => {
      if (
        files?.some(({ id, parents = [] }) => [id, ...parents].includes(fileId))
      ) {
        gFileMetaListCache.delete(key);
      }
    });
  });
};

/**
 * Retrieves metadata for a single Google Drive file.
 * Checks metadata cache first; returns cached data if available.
 * Otherwise fetches fresh metadata from Google Drive API and caches it.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param fileId - file identifier to retrieve metadata for
 * @returns `Promise<GDriveFileMeta>` - file metadata including id, name, mimeType, size, timestamps, parents, capabilities
 * @throws {DomainError} If API request fails or response is invalid
 */
export const getGDriveFileMeta = async (
  auth: GoogleAuthParams,
  fileId: string,
): Promise<GDriveFileMeta> => {
  const cached = gFileMetaCache.get(fileId);

  if (cached) {
    return cached;
  }

  const { result } = await authorizedRequest(
    'get',
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    auth,
    {
      dedupe: true,
    },
    zodGDriveFileMeta,
  );

  gFileMetaCache.set(fileId, result);

  return result;
};

/**
 * Updates file metadata (name, parents, trash status).
 * Performs a PATCH request to modify only specified fields; other fields remain unchanged.
 * Invalidates cache for the updated file and any files that reference it as a parent.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param fileId - file identifier to update
 * @param options - update parameters (UpdateParams)
 * @returns `{ result: {} }` with empty update result
 * @example
 * // Rename file
 * await update(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { name: 'new-name.pdf' }
 * );
 *
 * @example
 * // Move file to trash
 * await update(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { trashed: true }
 * );
 *
 * @example
 * // Restore file from trash
 * await update(
 *   { ACCESS_TOKEN: 'your-token' },
 *   'file-id',
 *   { trashed: false }
 * );
 *
 * @example
 * // Add parents and move to trash
 * await update(
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
export const update = (
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

  invalidateCache(fileId, ...(addParents ?? []), ...(removeParents ?? []));

  return result;
};
/**
 * LRU cache for downloaded file content.
 * Stores File objects keyed by fileId to avoid redundant downloads.
 * Includes modification time for cache validation (cache hit only if modifiedTime matches).
 * TTL: 30 seconds, max entries: 100, max size: 10 MB.
 */
const gDriveFileContentCache = new Cache<
  string,
  { file: File; modifiedTime: string }
>({
  max: 100,
  maxSize: 10 * 1024 * 1024,
  sizeCalculation: ({ file }) => file.size,
});
/**
 * Downloads file content as a File object.
 * Checks content cache first; returns cached File if available with matching modification time.
 * Otherwise fetches fresh content from Google Drive API and caches it.
 * Uses `alt=media` parameter for binary content retrieval without metadata.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param fileId - file identifier to download
 * @param params - optional download parameters (DownloadParams)
 * @returns `File` object with file content
 * @throws {DomainError} If API request fails (authorization error, rate limits, invalid response)
 * @throws {Error} If a network error occurs or timeout expires (wrapped in DomainError)
 */
export const download = async (
  auth: GoogleAuthParams,
  fileId: string,
  { onDownloadProgress }: DownloadParams = {},
): Promise<File> => {
  const { name, modifiedTime } = await getGDriveFileMeta(auth, fileId);

  const cachedFile = gDriveFileContentCache.get(fileId);

  if (cachedFile && modifiedTime === cachedFile.modifiedTime) {
    return cachedFile.file;
  }

  const file = await googleRequest(
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
    .then((r) => r.blob())
    .then(
      (blob) =>
        new File([blob], name, {
          type: blob.type,
        }),
    );

  gDriveFileContentCache.set(fileId, { file, modifiedTime });

  return file;
};
/**
 * Creates a new file in Google Drive.
 * Performs POST request to create a new file; validates that `parents` array is non-empty.
 * Invalidates cache for parent folders after creation.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param resource - file creation parameters (CreateResource)
 * @returns `{ result: { id: string } }` - new file ID
 * @example
 * // Create file in root
 * const { result: { id: fileId } } = await create(
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
export const create = (auth: GoogleAuthParams, resource: CreateResource) => {
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

  invalidateCache(...resource.parents);

  return result;
};

/**
 * Uploads content to an existing Google Drive file.
 * Supports multiple input types: string, Blob, ArrayBuffer, and ArrayBufferView (typed arrays like Uint8Array).
 * Automatically detects MIME type for binary data using file-type library; defaults to `application/octet-stream` if detection fails.
 * Uses PATCH with `uploadType=media` for media upload without metadata.
 *
 * @param auth - authentication object with required `ACCESS_TOKEN`
 * @param fileId - file identifier to upload content to
 * @param file - data to upload (string, Blob, ArrayBuffer, or ArrayBufferView)
 * @param onUploadProgress - optional callback for tracking upload progress
 * @returns `Response` object from ky with upload result
 * @throws {DomainError} If API request fails or response is invalid
 * @throws {Error} If the provided file has an unsupported type
 */
export const upload = async (
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

  invalidateCache(fileId);

  return response;
};

/**
 * Clears all caches (metadata and content).
 * Use after bulk operations or when starting a new session to free memory.
 * Resets LRU caches for file metadata, list responses, and downloaded content.
 *
 * @returns {void}
 * @example
 * // Clear all caches before starting fresh
 * clearCaches();
 */
export const clearCaches = (): void => {
  gDriveFileContentCache.clear();
  gFileMetaCache.clear();
  gFileMetaListCache.clear();
};

/**
 * Public Google Drive API with caching and request deduplication support.
 * Provides a simplified interface to Google Drive v3 API with automatic caching, pagination handling, and error normalization.
 * Exports: `getGFileMetaList`, `update`, `download`, `create`, `upload`, `clearCaches`.
 */

export default {
  getGFileMetaList,
  update,
  download,
  create,
  upload,
  clearCaches,
};
