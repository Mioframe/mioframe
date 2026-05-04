import { toMerged } from 'es-toolkit';
import { fileTypeFromBuffer } from 'file-type';
import type { Input, Options as KyOptions, Progress } from 'ky';
import ky, { HTTPError } from 'ky';
import { uid } from 'uid';
import type { ZodMiniType } from 'zod/v4-mini';
import { z } from 'zod/v4-mini';
import { HttpStatusCode } from '../../error/httpStatus';
import { GoogleDriveError } from '../error';
import { dedupe } from '../../dedupe';
import type {
  CreateResource,
  DownloadParams,
  GDriveFileMeta,
  GDriveListResponse,
  UpdateParams,
} from './types';
import {
  fieldsGDriveFileMeta,
  fieldsGDriveList,
  zodGDriveFileMeta,
  zodGDriveListResponse,
  zodGoogleErrorResponse,
  type ApiOptions,
  type GoogleAuthParams,
  type ListParams,
} from './types';
import { Cache } from '@shared/lib/cache';
import { withLog } from '@shared/lib/logger';
import { buildQuery } from '@shared/lib/googleDrive/api/queryBuild';

/**
 * Configured ky client with retry logic for production resilience.
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
 * @param url - Request URL or Request object for the Google Drive API call.
 * @param options - Optional request options, including auth and query parameters.
 * @returns Successful response or a normalized GoogleDriveError.
 */
const googleRequest = async (url: Input, options?: ApiOptions): Promise<Response> => {
  try {
    const response = options?.dedupe
      ? await dedupeApiFetch(url, options)
      : await apiFetch(url, options);

    if (!response.ok) {
      const errorBody = await response
        .clone()
        .json()
        .catch(() => ({}));

      const { error: googleError } = zodGoogleErrorResponse.parse(errorBody);

      const { code, message } = googleError;

      throw new GoogleDriveError(
        {
          code,
          message,
          details: googleError,
        },
        { cause: googleError },
      );
    }

    return response;
  } catch (e) {
    if (e instanceof HTTPError) {
      const errorBody = await e.response
        .clone()
        .json()
        .catch(() => ({}));

      const { error: googleError } = zodGoogleErrorResponse.parse(errorBody);

      const { code, message } = googleError;

      throw new GoogleDriveError(
        {
          code,
          message,
          details: googleError,
        },
        { cause: googleError },
      );
    }

    throw e;
  }
};

/**
 * Internal request handler with authentication and response validation.
 */
const authorizedRequest = withLog(
  async <R>(
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

    const result = responseSchema.parse(response);

    return { result };
  },
  { name: 'authorizedRequest', showResult: true },
);

/**
 * LRU cache for paginated file metadata lists.
 */
const gFileMetaListCache = new Cache<ListParams, GDriveListResponse>({
  max: 500,
  ttl: 30e3,
});

/**
 * Retrieves a list of Google Drive files with caching and request deduplication support.
 *
 * The query parameter `q` is automatically transformed using `buildQuery()` to ensure
 * consistent formatting and proper handling of special characters.
 */
export const getGFileMetaList = withLog(
  async (
    auth: GoogleAuthParams,
    { pageSize = 1000, pageToken = '', q, spaces = [], fetchAll = true }: ListParams,
  ) => {
    let result: GDriveListResponse | undefined = undefined;

    const fields = fieldsGDriveList;
    const cacheKey = {
      pageSize,
      pageToken,
      q,
      spaces,
      fetchAll,
      fields,
    };

    result = gFileMetaListCache.get(cacheKey);

    if (result) {
      return result;
    }

    const fetchPage = async (nextPageToken: string) =>
      authorizedRequest(
        'get',
        'https://www.googleapis.com/drive/v3/files',
        auth,
        {
          searchParams: {
            pageSize,
            pageToken: nextPageToken,
            q: q ? buildQuery(q) : '',
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
        // eslint-disable-next-line no-await-in-loop -- each next page token comes from the previous response, so pagination must stay sequential
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
      gFileMetaListCache.set(cacheKey, result);
    }

    return result;
  },
  {
    name: 'getGFileMetaList',
    showResult: true,
    showArgs: true,
    snapshot: true,
  },
);

/**
 * LRU cache for individual file metadata.
 */
const gFileMetaCache = new Cache<string, GDriveFileMeta>({
  max: 500,
  ttl: 30e3,
});

/**
 * Invalidates cache entries for specified file IDs and dependent entries.
 */
const invalidateCache = withLog(
  (...fileIdList: string[]): void => {
    fileIdList.forEach((fileId) => {
      gFileMetaCache.delete(fileId);
      gDriveFileContentCache.delete(fileId);
      const metadataKeysToDelete: string[] = [];
      gFileMetaCache.forEach(({ parents }, key) => {
        if (parents?.includes(fileId)) {
          metadataKeysToDelete.push(key);
        }
      });
      metadataKeysToDelete.forEach((key) => {
        gFileMetaCache.delete(key);
      });

      const listKeysToDelete: string[] = [];
      gFileMetaListCache.forEachEntry(({ files }, key, listParams) => {
        const matchesParentId = typeof listParams !== 'string' && listParams.q?.parentId === fileId;
        const matchesFileRelation =
          files?.some(({ id, parents = [] }) => [id, ...parents].includes(fileId)) ?? false;

        if (matchesParentId || matchesFileRelation) {
          listKeysToDelete.push(key);
        }
      });
      listKeysToDelete.forEach((key) => {
        gFileMetaListCache.delete(key);
      });
    });
  },
  { name: 'invalidateCache', showArgs: true },
);

/**
 * Retrieves metadata for a single Google Drive file.
 * @param auth - Google auth parameters for the request.
 * @param fileId - Google Drive file id.
 * @returns Parsed file metadata.
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

const createUploadBody = async (
  file: FileSystemWriteChunkType,
): Promise<{
  body: Blob;
}> => {
  if (typeof file === 'string') {
    const body = new Blob([file], { type: 'text/plain' });

    return {
      body,
    };
  }

  if (file instanceof Blob) {
    return {
      body: file,
    };
  }

  if (file instanceof ArrayBuffer || ArrayBuffer.isView(file)) {
    const buffer =
      file instanceof ArrayBuffer
        ? new Uint8Array(file)
        : new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
    const mimeTypeInfo = await fileTypeFromBuffer(buffer);
    const contentType = mimeTypeInfo ? mimeTypeInfo.mime : 'application/octet-stream';
    const body = new Blob([buffer], { type: contentType });

    return {
      body,
    };
  }

  throw new Error('Unsupported file type');
};

/**
 * Updates file metadata (name, parents, trash status).
 * @param auth - Google auth parameters for the request.
 * @param fileId - Google Drive file id.
 * @param params - Partial metadata update payload.
 * @returns Empty successful response payload from Drive.
 */
export const update = async (auth: GoogleAuthParams, fileId: string, params: UpdateParams) => {
  const { name, addParents, removeParents, trashed } = params;
  const result = await authorizedRequest(
    'patch',
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    auth,
    {
      searchParams: {
        ...(addParents?.length ? { addParents: addParents.join(',') } : {}),
        ...(removeParents?.length ? { removeParents: removeParents.join(',') } : {}),
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
 *
 * Stores file blobs with metadata to avoid redundant downloads.
 * Uses file ID as key, stores File object and modification time.
 *
 * Limits: 100 entries or 100 MB total (whichever reached first).
 * Evicted by LRU policy when limits exceeded.
 */
const gDriveFileContentCache = new Cache<string, { file: File; modifiedTime: string }>({
  max: 100,
  maxSize: 100 * 1024 * 1024,
  sizeCalculation: ({ file }) => file.size,
});

/**
 * Downloads file content as a File object.
 * @param auth - Google auth parameters for the request.
 * @param fileId - Google Drive file id.
 * @param params - Optional progress callback configuration.
 * @returns Downloaded browser File instance.
 */
export const download = async (
  auth: GoogleAuthParams,
  fileId: string,
  params: DownloadParams = {},
): Promise<File> => {
  const { onDownloadProgress } = params;
  const { name, modifiedTime } = await getGDriveFileMeta(auth, fileId);

  const cachedFile = gDriveFileContentCache.get(fileId);

  if (cachedFile && modifiedTime === cachedFile.modifiedTime) {
    return cachedFile.file;
  }

  const file = await googleRequest(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${auth.ACCESS_TOKEN}`,
    },
    searchParams: {
      alt: 'media',
    },
    ...(onDownloadProgress ? { onDownloadProgress } : {}),
    dedupe: true,
  })
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
 * @param auth - Google auth parameters for the request.
 * @param resource - Metadata for the Drive file to create.
 * @returns Created file id payload.
 */
export const create = async (auth: GoogleAuthParams, resource: CreateResource) => {
  if (resource.parents.length === 0) {
    throw new GoogleDriveError({
      code: HttpStatusCode.FORBIDDEN,
      message: 'Parents array cannot be empty',
    });
  }

  const result = await authorizedRequest(
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
 * Creates a new file and uploads its content in a single multipart Drive request.
 * @param auth - Google auth parameters for the request.
 * @param resource - Metadata for the Drive file to create.
 * @param file - Initial file content to upload.
 * @returns Parsed metadata of the created Drive file.
 */
export const createWithContent = async (
  auth: GoogleAuthParams,
  resource: CreateResource,
  file: FileSystemWriteChunkType,
): Promise<{ result: GDriveFileMeta }> => {
  if (resource.parents.length === 0) {
    throw new GoogleDriveError({
      code: HttpStatusCode.FORBIDDEN,
      message: 'Parents array cannot be empty',
    });
  }

  const { body } = await createUploadBody(file);
  const boundary = `drive-multipart-${uid(24)}`;
  const multipartBody = new Blob([
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(resource),
    '\r\n',
    `--${boundary}\r\n`,
    `Content-Type: ${body.type || 'application/octet-stream'}\r\n\r\n`,
    body,
    '\r\n',
    `--${boundary}--`,
  ]);

  const response = await googleRequest('https://www.googleapis.com/upload/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.ACCESS_TOKEN}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    searchParams: {
      key: auth.API_KEY,
      uploadType: 'multipart',
      fields: fieldsGDriveFileMeta,
    },
    body: multipartBody,
  });

  const result = zodGDriveFileMeta.parse(await response.json());

  invalidateCache(...resource.parents);

  return { result };
};

/**
 * Uploads content to an existing Google Drive file.
 * @param auth - Google auth parameters for the request.
 * @param fileId - Google Drive file id.
 * @param file - File content to upload.
 * @param onUploadProgress - Optional progress callback for upload progress events.
 * @returns Raw successful upload response.
 */
export const upload = async (
  auth: GoogleAuthParams,
  fileId: string,
  file: FileSystemWriteChunkType,
  onUploadProgress?: (progress: Progress, chunk: Uint8Array) => void,
): Promise<Response> => {
  const { body } = await createUploadBody(file);

  const response = await googleRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': body.type || 'application/octet-stream',
        Authorization: `Bearer ${auth.ACCESS_TOKEN}`,
      },
      searchParams: {
        uploadType: 'media',
        fields: ['id', 'version', 'name'].join(','),
      },
      body,
      ...(onUploadProgress ? { onUploadProgress } : {}),
    },
  );

  invalidateCache(fileId);

  return response;
};

/**
 * Clears all caches (metadata and content).
 */
export const clearCaches = (): void => {
  gDriveFileContentCache.clear();
  gFileMetaCache.clear();
  gFileMetaListCache.clear();
};

/**
 * Public Google Drive API with caching and request deduplication support.
 *
 * Provides a complete set of operations for interacting with Google Drive:
 * - List files with structured query parameters
 * - Get single file metadata
 * - Create new files
 * - Update file metadata (name, parents, trash status)
 * - Download file content
 * - Upload content to existing files
 *
 * All operations use LRU caching for performance and request deduplication
 * to prevent duplicate simultaneous requests.
 */

export default {
  getGFileMetaList,
  update,
  download,
  create,
  upload,
  createWithContent,
  clearCaches,
};
