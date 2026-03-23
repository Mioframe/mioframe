import { toMerged } from 'es-toolkit';
import { fileTypeFromBuffer } from 'file-type';
import type { Input, Options as KyOptions, Progress } from 'ky';
import ky, { HTTPError } from 'ky';
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

  const result = responseSchema.parse(response);

  return { result };
};

/**
 * LRU cache for paginated file metadata lists.
 */
const gFileMetaListCache = new Cache<ListParams, GDriveListResponse>({
  max: 500,
  ttl: 30e3,
});

/**
 * Retrieves a list of Google Drive files with caching and request deduplication support.
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
 */
const gFileMetaCache = new Cache<string, GDriveFileMeta>({
  max: 100,
  ttl: 30e3,
});

/**
 * Invalidates cache entries for specified file IDs and dependent entries.
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
 */
export const create = (auth: GoogleAuthParams, resource: CreateResource) => {
  if (resource.parents.length === 0) {
    throw new GoogleDriveError({
      code: HttpStatusCode.FORBIDDEN,
      message: 'Parents array cannot be empty',
    });
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
 */
export const clearCaches = (): void => {
  gDriveFileContentCache.clear();
  gFileMetaCache.clear();
  gFileMetaListCache.clear();
};

/**
 * Public Google Drive API with caching and request deduplication support.
 */

export default {
  getGFileMetaList,
  update,
  download,
  create,
  upload,
  clearCaches,
};
