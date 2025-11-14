import { toMerged } from 'es-toolkit';
import { fileTypeFromBuffer } from 'file-type';
import type { Options, Progress } from 'ky';
import ky from 'ky';
import type { ZodMiniType } from 'zod/v4-mini';
import { z } from 'zod/v4-mini';

enum ORDER_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}

type SortableKeys =
  | 'createdTime'
  | 'folder'
  | 'modifiedByMeTime'
  | 'modifiedTime'
  | 'name'
  | 'name_natural'
  | 'quotaBytesUsed'
  | 'recency'
  | 'sharedWithMeTime'
  | 'starred'
  | 'viewedByMeTime';

export enum SPACE {
  drive = 'drive',
  appDataFolder = 'appDataFolder',
}

interface ListParams {
  corpora?: 'user' | 'domain' | 'drive' | 'allDrives';
  driveId?: string;
  includeItemsFromAllDrives?: boolean;
  orderBy?: Partial<Record<SortableKeys, ORDER_DIRECTION>>;
  pageSize?: number;
  pageToken?: string;
  q: string;
  spaces?: SPACE[];
  supportsAllDrives?: boolean;
  includePermissionsForView?: string;
  includeLabels?: string;
  trashed?: boolean;
}

export interface GoogleAuthParams {
  API_KEY?: string;
  ACCESS_TOKEN: string;
}

const authorizedRequest = async <R>(
  method: Required<Options['method']>,
  url: `https://${string}`,
  { ACCESS_TOKEN, API_KEY }: GoogleAuthParams,
  options: Options = {},
  responseSchema: ZodMiniType<R>,
) => {
  const response = await ky(
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
  ).json();

  return { result: responseSchema.parse(response) };
};

/**
 * https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list
 */
const list = async (
  auth: GoogleAuthParams,
  {
    corpora,
    driveId,
    includeItemsFromAllDrives,
    orderBy,
    pageSize,
    pageToken,
    q,
    spaces,
    supportsAllDrives,
    includePermissionsForView,
    includeLabels,
  }: ListParams,
) =>
  authorizedRequest(
    'get',
    'https://www.googleapis.com/drive/v3/files',
    auth,
    {
      searchParams: {
        corpora,
        driveId,
        includeItemsFromAllDrives,
        orderBy: orderBy
          ? Object.entries(orderBy).reduce(
              (acc: string, [key, direction], index) => {
                if (direction === ORDER_DIRECTION.DESC) {
                  return `${(index > 0 ? ',' : '') + acc + key} desc`;
                }

                return (index > 0 ? ',' : '') + acc + key;
              },
              '',
            )
          : undefined,
        pageSize,
        pageToken,
        q,
        spaces: spaces?.join(','),
        supportsAllDrives,
        includePermissionsForView,
        includeLabels,
        fields: 'files(id, name, mimeType)',
      },
    },
    z.object({
      files: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          mimeType: z.string(),
        }),
      ),
      nextPageToken: z.string(),
      kind: z.string(),
      incompleteSearch: z.boolean(),
    }),
  );

const update = (
  auth: GoogleAuthParams,
  fileId: string,
  { name, addParents }: { name?: string; addParents?: string[] },
) =>
  authorizedRequest(
    'patch',
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
    auth,
    {
      json: {
        name,
        addParents: addParents?.join(','),
      },
    },
    z.object({}),
  );

const download = (
  auth: GoogleAuthParams,
  fileId: string,
  name: string = 'file',
  onDownloadProgress?: (progress: Progress, chunk: Uint8Array) => unknown,
) =>
  ky(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${auth.ACCESS_TOKEN}`,
    },
    searchParams: {
      alt: 'media',
    },
    onDownloadProgress,
  })
    .blob()
    .then(
      (blob) =>
        new File([blob], name, {
          type: blob.type,
        }),
    );

const create = (
  auth: GoogleAuthParams,
  {
    resource,
  }: {
    resource: {
      name: string;
      mimeType?: `${string}/${string}`;
      parents: string[];
    };
  },
) =>
  authorizedRequest(
    'post',
    'https://www.googleapis.com/drive/v3/files',
    auth,
    {
      json: {
        resource,
      },
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

  const response = await ky(
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

const remove = (auth: GoogleAuthParams, fileId: string) =>
  authorizedRequest(
    'delete',
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    auth,
    {},
    z.object(),
  );

const copy = (
  auth: GoogleAuthParams,
  fileId: string,
  file: {
    resource: {
      name: string;
      parents: string[];
    };
  },
) =>
  authorizedRequest(
    'post',
    `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
    auth,
    {
      json: file,
    },
    z.object({ id: z.string(), name: z.string() }),
  );

export const files = {
  list,
  update,
  download,
  create,
  upload,
  delete: remove,
  remove,
  copy,
};

export const api = { files };
