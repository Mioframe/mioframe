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

export enum SPACE {
  drive = 'drive',
  appDataFolder = 'appDataFolder',
}

interface ListParams {
  pageSize?: number;
  pageToken?: string;
  q?: string;
  spaces?: SPACE[];
  /**
   * Если true, будет автоматически загружать все страницы результатов.
   */
  fetchAll?: boolean;
  /**
   * Список полей для выборки.
   */
  fields?: string;
}

export interface GoogleAuthParams {
  API_KEY?: string;
  ACCESS_TOKEN: string;
}

const zodGoogleErrorResponse = z.object({
  error: z.object({
    message: z.string(),
  }),
});

// Настройка клиента с повторными запросами для продакшена
const apiClient = ky.create({
  retry: {
    limit: 3,
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace', 'patch'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: 30000,
});

/**
 * Options for API requests with deduplication support.
 * @extends KyOptions
 */
interface ApiOptions extends KyOptions {
  /**
   * When enabled, prevents duplicate requests from being sent simultaneously.
   * @default false
   */
  dedupe?: boolean;
}

const apiFetch = (url: Input, options?: KyOptions) => apiClient(url, options);

const dedupeApiFetch = dedupe(apiFetch);

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

export type GDriveFile = z.output<typeof zodGDriveFile>;

const listResponseSchema = z.object({
  files: z.optional(z.array(zodGDriveFile)),
  nextPageToken: z.optional(z.string()),
});

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
      token: auth.ACCESS_TOKEN,
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
  }

  if (result.result.files) {
    metadataCache.setList(cacheKey, {
      files: result.result.files,
      nextPageToken: result.result.nextPageToken,
    });
  }

  return result;
};

const update = (
  auth: GoogleAuthParams,
  fileId: string,
  {
    name,
    addParents,
    removeParents,
    trashed,
  }: {
    name?: string;
    addParents?: string[];
    removeParents?: string[];
    trashed?: boolean;
  },
) =>
  authorizedRequest(
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

const download = async (
  auth: GoogleAuthParams,
  fileId: string,
  name: string = 'file',
  modifiedTime?: string,
  onDownloadProgress?: (progress: Progress, chunk: Uint8Array) => unknown,
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

const create = (
  auth: GoogleAuthParams,
  resource: {
    name: string;
    mimeType?: string;
    parents: string[];
  },
) =>
  authorizedRequest(
    'post',
    'https://www.googleapis.com/drive/v3/files',
    auth,
    {
      json: resource,
    },
    z.object({ id: z.string() }),
  );

const upload = async (
  auth: GoogleAuthParams,
  fileId: string,
  file: FileSystemWriteChunkType,
  onUploadProgress?: (progress: Progress, chunk: Uint8Array) => unknown,
) => {
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

const invalidateFileContent = (fileId: string) => {
  fileContentCache.invalidate(fileId);
};

const invalidateFolderContents = (folderId: string) => {
  metadataCache.invalidateByFolderId(folderId);
};

export const simplifiedGoogleDriveAPI = {
  list,
  update,
  download,
  create,
  upload,
  invalidateFileContent,
  invalidateFolderContents,
  clearCaches: () => {
    metadataCache.clear();
    fileContentCache.clear();
  },
};
