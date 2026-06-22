import { describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  encodePrimaryV3FileName,
  encodeStorageKeyToV2FileName,
  partialKeyToFileName,
  storageAdapterMarkerFileName,
} from '@shared/lib/automergeAdapter';
import { encodeV3StorageWrapper } from '@shared/lib/automergeAdapter/wrapperCodecV3';
import { DomainError } from '@shared/lib/error';
import { HttpStatusCode } from '@shared/lib/error/httpStatus';
import { GoogleDriveError } from '@shared/lib/googleDrive/error';
import {
  FileSystemError,
  FSNodeType,
  type FSNodeStat,
  VirtualFileSystem,
  VfsError,
} from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { RepositoryFactsErrorCode } from './repositoryFactsErrorCode';
import {
  cleanupDeletedDocumentStorageFiles,
  getDocumentStorageFiles,
  getRegularDirectoryEntries,
  getRepositoryFacts,
  isRepositoryStorageCandidateFileName,
  isRepositoryMarkerFileName,
  removeDocumentStorageFiles,
  shouldHideRepositoryStorageFile,
} from './repositoryStorageFiles';
import type { ChunkStorageKey } from '@shared/lib/automergeAdapter';

const captureDiagnosticExceptionMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    captureDiagnosticException: captureDiagnosticExceptionMock,
  };
});

const createStat = (type: FSNodeType): FSNodeStat => ({
  type,
  capabilities: {},
});

const createDocumentStorageFileName = () => {
  const documentId = new Repo().create({}).documentId;
  const fileName = partialKeyToFileName([documentId, 'snapshot', 'hash']);

  if (!fileName) {
    throw new Error(`Failed to create repository storage file for "${documentId}"`);
  }

  return { documentId, fileName };
};

const SAMPLE_HEX_HASH = 'a'.repeat(64);
const OTHER_HEX_HASH = 'b'.repeat(64);

const createV2DocumentStorageFileName = () => {
  const documentId = new Repo().create({}).documentId;
  const fileName = encodeStorageKeyToV2FileName(documentId, 'snapshot', SAMPLE_HEX_HASH);

  if (!fileName) {
    throw new Error(`Failed to create v2 storage filename for "${documentId}"`);
  }

  return { documentId, fileName };
};

const createPrimaryV3StorageFileName = (documentId: AMDocumentId, hashSuffix: string) => {
  const key: ChunkStorageKey = [
    documentId,
    'snapshot',
    `${SAMPLE_HEX_HASH.slice(0, 60)}${hashSuffix}`,
  ];
  const fileName = encodePrimaryV3FileName(key);

  if (!fileName) {
    throw new Error('Expected v3 filename');
  }

  return { fileName, key };
};

describe('getRepositoryFacts', () => {
  it('detects an initialized empty repository from the marker file', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    expect(
      await getRepositoryFacts(vfs, path, [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['notes.txt', createStat(FSNodeType.File)],
      ]),
    ).toEqual({
      documentIds: [],
      isInitialized: true,
    });
  });

  it('treats folders with document files as initialized even without the marker file', async () => {
    const { documentId, fileName } = createDocumentStorageFileName();
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    expect(
      await getRepositoryFacts(vfs, path, [
        [fileName, createStat(FSNodeType.File)],
        ['notes.txt', createStat(FSNodeType.File)],
      ]),
    ).toEqual({
      documentIds: [documentId],
      isInitialized: true,
    });
  });

  it('treats a regular folder without repository storage as uninitialized', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    expect(
      await getRepositoryFacts(vfs, path, [
        ['notes.txt', createStat(FSNodeType.File)],
        ['Nested', createStat(FSNodeType.Directory)],
      ]),
    ).toEqual({
      documentIds: [],
      isInitialized: false,
    });
  });

  it('discovers full document ids from valid v3 wrappers', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const hash = SAMPLE_HEX_HASH;
    const key = [documentId, 'snapshot', hash] as const;
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${fileName}`,
      encodeV3StorageWrapper([...key], new Uint8Array([1])),
    );

    await expect(getRepositoryFacts(vfs, path)).resolves.toEqual({
      documentIds: [documentId],
      isInitialized: true,
    });
  });

  it('does not use the 6-character v3 document prefix as the document id', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const key = [documentId, 'snapshot', SAMPLE_HEX_HASH] as const;
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${fileName}`,
      encodeV3StorageWrapper([...key], new Uint8Array([1])),
    );

    const facts = await getRepositoryFacts(vfs, path);

    expect(facts.documentIds).toEqual([documentId]);
    expect(facts.documentIds).not.toContain(documentId.slice(0, 6));
  });

  it('ignores unreleased manual and copied v3 suffix candidates during repository discovery', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const key: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const docPrefix = documentId.slice(0, 6);
    const hashPrefix = SAMPLE_HEX_HASH.slice(0, 8);
    const names = [
      `${docPrefix}.s.${hashPrefix} (1).mf`,
      `${docPrefix}.s.${hashPrefix} - copy.mf`,
      `${docPrefix}.s.${hashPrefix}.1.mf`,
    ] as const;

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop -- each candidate should remain individually visible
      await vfs.writeFile(`${path}/${name}`, encodeV3StorageWrapper(key, new Uint8Array([1])));
    }

    const facts = await getRepositoryFacts(
      vfs,
      path,
      names.map((name) => [name, createStat(FSNodeType.File)]),
    );

    expect(facts).toEqual({
      documentIds: [],
      isInitialized: false,
    });
  });

  it('skips malformed, truncated, empty, and unrelated v3 candidates during repository discovery', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const validKey: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const malformedName = `${documentId.slice(0, 6)}.s.${SAMPLE_HEX_HASH.slice(0, 8)}.mf`;
    const truncatedName = `${documentId.slice(0, 6)}.i.${OTHER_HEX_HASH.slice(0, 8)}.mf`;
    const emptyName = `${documentId.slice(0, 6)}.s.${OTHER_HEX_HASH.slice(0, 8)}.1.mf`;
    const unrelatedName = 'notes.mf';

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(`${path}/${malformedName}`, new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
    await vfs.writeFile(`${path}/${truncatedName}`, new Uint8Array([1]));
    await vfs.writeFile(
      `${path}/${emptyName}`,
      encodeV3StorageWrapper([documentId, 'snapshot', OTHER_HEX_HASH], new Uint8Array()),
    );
    await vfs.writeFile(`${path}/${unrelatedName}`, new Uint8Array([1, 2, 3]));
    await vfs.writeFile(
      `${path}/${malformedName}.valid`,
      encodeV3StorageWrapper(validKey, new Uint8Array([7])),
    );

    const facts = await getRepositoryFacts(vfs, path, [
      [malformedName, createStat(FSNodeType.File)],
      [truncatedName, createStat(FSNodeType.File)],
      [emptyName, createStat(FSNodeType.File)],
      [unrelatedName, createStat(FSNodeType.File)],
      [`${malformedName}.valid`, createStat(FSNodeType.File)],
    ]);

    expect(facts).toEqual({
      documentIds: [],
      isInitialized: false,
    });
  });

  it('dedupes v3, v2, and legacy entries for the same document id', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const key: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const v3Name = encodePrimaryV3FileName([...key]);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', SAMPLE_HEX_HASH);
    const legacyName = partialKeyToFileName(key);

    if (!v3Name || !v2Name || !legacyName) {
      throw new Error('Expected storage filenames');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(`${path}/${v3Name}`, encodeV3StorageWrapper([...key], new Uint8Array([1])));

    const facts = await getRepositoryFacts(vfs, path, [
      [v3Name, createStat(FSNodeType.File)],
      [v2Name, createStat(FSNodeType.File)],
      [legacyName, createStat(FSNodeType.File)],
    ]);

    expect(facts.documentIds).toEqual([documentId]);
  });

  it('treats a marker-only repository as initialized when an unrelated v3 candidate is unreadable', async () => {
    captureDiagnosticExceptionMock.mockClear();

    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const key: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${storageAdapterMarkerFileName}`,
      new File(['marker'], storageAdapterMarkerFileName),
    );
    await vfs.writeFile(
      `${path}/${fileName}`,
      encodeV3StorageWrapper([...key], new Uint8Array([1])),
    );

    const readError = new VfsError(FileSystemError.Unknown, 'Google Drive download request failed');
    vi.spyOn(vfs, 'readFile').mockImplementation(async (filePath) => {
      if (filePath === `${path}/${fileName}`) {
        throw readError;
      }

      return VirtualFileSystem.prototype.readFile.call(vfs, filePath);
    });

    const facts = await getRepositoryFacts(vfs, path, [
      [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
      [fileName, createStat(FSNodeType.File)],
    ]);

    expect(facts).toEqual({
      documentIds: [],
      isInitialized: true,
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cause: readError,
        code: RepositoryFactsErrorCode.storageCandidateReadFailed,
      }),
      expect.objectContaining({ operation: 'repositoryFactsDiscovery' }),
    );

    const [capturedError] = captureDiagnosticExceptionMock.mock.lastCall ?? [];
    expect(capturedError).toBeInstanceOf(DomainError);
  });

  it('forwards safe Google Drive provider details as visible diagnostic context fields', async () => {
    captureDiagnosticExceptionMock.mockClear();

    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const key: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${fileName}`,
      encodeV3StorageWrapper([...key], new Uint8Array([1])),
    );

    const providerError = new GoogleDriveError({
      code: HttpStatusCode.FORBIDDEN,
      message: 'Google Drive download failed',
      safeDetails: {
        providerOperation: 'googleDrive.download',
        providerPhase: 'mediaDownload',
        providerStatus: HttpStatusCode.FORBIDDEN,
        providerReason: 'insufficientFilePermissions',
        providerDomain: 'global',
        providerRetryable: 'false',
        providerErrorCode: 'permissionDenied',
      },
    });
    const readError = new VfsError(
      FileSystemError.Unknown,
      'Google Drive download operation failed',
      providerError,
    );
    vi.spyOn(vfs, 'readFile').mockRejectedValue(readError);

    await getRepositoryFacts(vfs, path, [[fileName, createStat(FSNodeType.File)]]);

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [, context] = captureDiagnosticExceptionMock.mock.lastCall ?? [];

    expect(context).toMatchObject({
      operation: 'repositoryFactsDiscovery',
      safeDetails: {
        providerOperation: 'googleDrive.download',
        providerPhase: 'mediaDownload',
        providerStatus: HttpStatusCode.FORBIDDEN,
        providerReason: 'insufficientFilePermissions',
        providerDomain: 'global',
        providerRetryable: 'false',
        providerErrorCode: 'permissionDenied',
      },
    });

    const serializedContext = JSON.stringify(context);
    expect(serializedContext).not.toContain(path);
    expect(serializedContext).not.toContain(documentId);
    expect(serializedContext).not.toContain(fileName);
  });

  it('does not throw and reports diagnostics for an unreadable v3 candidate without a marker file', async () => {
    captureDiagnosticExceptionMock.mockClear();

    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const key: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${fileName}`,
      encodeV3StorageWrapper([...key], new Uint8Array([1])),
    );

    const readError = new VfsError(FileSystemError.Unknown, 'Google Drive download request failed');
    vi.spyOn(vfs, 'readFile').mockRejectedValue(readError);

    const facts = await getRepositoryFacts(vfs, path, [[fileName, createStat(FSNodeType.File)]]);

    expect(facts).toEqual({
      documentIds: [],
      isInitialized: false,
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);

    const [capturedError, context] = captureDiagnosticExceptionMock.mock.lastCall ?? [];
    const serializedContext = JSON.stringify(context);

    expect(serializedContext).not.toContain(path);
    expect(serializedContext).not.toContain(documentId);
    expect(serializedContext).not.toContain(fileName);

    if (!(capturedError instanceof DomainError)) {
      throw new Error('Expected a DomainError');
    }

    expect(capturedError.message).not.toContain(path);
    expect(capturedError.message).not.toContain(documentId);
    expect(capturedError.message).not.toContain(fileName);
    expect(capturedError.cause).toBe(readError);
    expect(capturedError.code).toBe(RepositoryFactsErrorCode.storageCandidateReadFailed);
  });

  it('captures diagnostics only once per discovery pass when multiple candidates fail to read', async () => {
    captureDiagnosticExceptionMock.mockClear();

    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const firstDocumentId = new Repo().create({}).documentId;
    const secondDocumentId = new Repo().create({}).documentId;
    const firstKey: ChunkStorageKey = [firstDocumentId, 'snapshot', SAMPLE_HEX_HASH];
    const secondKey: ChunkStorageKey = [secondDocumentId, 'snapshot', SAMPLE_HEX_HASH];
    const firstFileName = encodePrimaryV3FileName([...firstKey]);
    const secondFileName = encodePrimaryV3FileName([...secondKey]);

    if (!firstFileName || !secondFileName) {
      throw new Error('Expected v3 filenames');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${firstFileName}`,
      encodeV3StorageWrapper([...firstKey], new Uint8Array([1])),
    );
    await vfs.writeFile(
      `${path}/${secondFileName}`,
      encodeV3StorageWrapper([...secondKey], new Uint8Array([1])),
    );

    vi.spyOn(vfs, 'readFile').mockRejectedValue(
      new VfsError(FileSystemError.Unknown, 'Google Drive download request failed'),
    );

    const facts = await getRepositoryFacts(vfs, path, [
      [firstFileName, createStat(FSNodeType.File)],
      [secondFileName, createStat(FSNodeType.File)],
    ]);

    expect(facts).toEqual({
      documentIds: [],
      isInitialized: false,
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('treats a FileNotFound candidate race as a normal skip without diagnostics', async () => {
    captureDiagnosticExceptionMock.mockClear();

    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const key: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    vi.spyOn(vfs, 'readFile').mockRejectedValue(
      new VfsError(FileSystemError.FileNotFound, 'Not found'),
    );

    const facts = await getRepositoryFacts(vfs, path, [[fileName, createStat(FSNodeType.File)]]);

    expect(facts).toEqual({
      documentIds: [],
      isInitialized: false,
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });
});

describe('getRegularDirectoryEntries', () => {
  it('hides repository storage files by default', () => {
    const { fileName } = createDocumentStorageFileName();

    const result = getRegularDirectoryEntries(
      [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        [fileName, createStat(FSNodeType.File)],
        ['plain.json', createStat(FSNodeType.File)],
      ],
      true,
    );

    expect(result.map(([name]) => name)).toEqual(['plain.json']);
  });

  it('keeps Automerge document files visible when hiding is disabled', () => {
    const { fileName } = createDocumentStorageFileName();

    const result = getRegularDirectoryEntries(
      [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        [fileName, createStat(FSNodeType.File)],
        ['plain.json', createStat(FSNodeType.File)],
      ],
      false,
    );

    expect(result.map(([name]) => name)).toEqual([fileName, 'plain.json']);
  });
});

describe('repository storage file classifiers', () => {
  it('classifies marker and document storage names separately', () => {
    const { fileName } = createDocumentStorageFileName();

    expect(isRepositoryMarkerFileName(storageAdapterMarkerFileName)).toBe(true);
    expect(isRepositoryMarkerFileName('plain.json')).toBe(false);
    expect(isRepositoryStorageCandidateFileName(fileName)).toBe(true);
    expect(isRepositoryStorageCandidateFileName('plain.json')).toBe(false);
  });

  it('hides only the storage files requested by the current visibility setting', () => {
    const { fileName } = createDocumentStorageFileName();

    expect(shouldHideRepositoryStorageFile(storageAdapterMarkerFileName, true)).toBe(true);
    expect(shouldHideRepositoryStorageFile(fileName, true)).toBe(true);
    expect(shouldHideRepositoryStorageFile(fileName, false)).toBe(false);
    expect(shouldHideRepositoryStorageFile('plain.json', true)).toBe(false);
  });
});

describe('v2 compact .am filename filtering', () => {
  it('classifies v2 .am storage files as repository storage candidates', () => {
    const { fileName } = createV2DocumentStorageFileName();

    expect(isRepositoryStorageCandidateFileName(fileName)).toBe(true);
  });

  it('hides v2 .am storage files when hideAutomergeFiles is true', () => {
    const { fileName } = createV2DocumentStorageFileName();

    expect(shouldHideRepositoryStorageFile(fileName, true)).toBe(true);
  });

  it('keeps v2 .am storage files visible when hideAutomergeFiles is false', () => {
    const { fileName } = createV2DocumentStorageFileName();

    expect(shouldHideRepositoryStorageFile(fileName, false)).toBe(false);
  });

  it('does not classify unrelated .am files as Automerge storage', () => {
    expect(isRepositoryStorageCandidateFileName('notes.am')).toBe(false);
    expect(isRepositoryStorageCandidateFileName('attachment.am')).toBe(false);
  });

  it('filters out both legacy and v2 storage files from visible entries', () => {
    const { fileName: legacyFileName } = createDocumentStorageFileName();
    const { fileName: v2FileName } = createV2DocumentStorageFileName();

    const result = getRegularDirectoryEntries(
      [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        [legacyFileName, createStat(FSNodeType.File)],
        [v2FileName, createStat(FSNodeType.File)],
        ['notes.txt', createStat(FSNodeType.File)],
        ['attachment.am', createStat(FSNodeType.File)],
      ],
      true,
    );

    expect(result.map(([name]) => name)).toEqual(['notes.txt', 'attachment.am']);
  });

  it('extracts document ids from v2 storage filenames for repository facts', async () => {
    const { documentId, fileName } = createV2DocumentStorageFileName();
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    const facts = await getRepositoryFacts(vfs, path, [[fileName, createStat(FSNodeType.File)]]);

    expect(facts.isInitialized).toBe(true);
    expect(facts.documentIds).toContain(documentId);
  });
});

describe('getDocumentStorageFiles', () => {
  it('finds valid v3 storage files for the full document id', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    const documentId = new Repo().create({}).documentId;
    const key = [documentId, 'snapshot', SAMPLE_HEX_HASH] as const;
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    await vfs.writeFile(
      `${path}/${fileName}`,
      encodeV3StorageWrapper([...key], new Uint8Array([1])),
    );

    await expect(getDocumentStorageFiles(vfs, path, documentId)).resolves.toHaveLength(1);
  });

  it('propagates non-file-not-found read failures instead of skipping the candidate', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    const documentId = new Repo().create({}).documentId;
    const key = [documentId, 'snapshot', SAMPLE_HEX_HASH] as const;
    const fileName = encodePrimaryV3FileName([...key]);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    await vfs.writeFile(
      `${path}/${fileName}`,
      encodeV3StorageWrapper([...key], new Uint8Array([1])),
    );

    const readError = new VfsError(FileSystemError.Unknown, 'read failed');
    vi.spyOn(vfs, 'readFile').mockRejectedValue(readError);

    await expect(getDocumentStorageFiles(vfs, path, documentId)).rejects.toBe(readError);
  });
});

describe('removeDocumentStorageFiles', () => {
  it('removes all matching storage files with bounded concurrency and preserves unrelated files', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const unrelatedDocumentId = new Repo().create({}).documentId;
    const maxAllowedConcurrency = 4;
    let activeDeletes = 0;
    let maxConcurrentDeletes = 0;
    const deletedPaths: string[] = [];
    let releaseDeletes!: () => void;
    const deleteGate = new Promise<void>((resolve) => {
      releaseDeletes = resolve;
    });

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${storageAdapterMarkerFileName}`,
      new File(['marker'], storageAdapterMarkerFileName),
    );

    for (let i = 0; i < 9; i += 1) {
      const { fileName, key } = createPrimaryV3StorageFileName(documentId, `${i}`.padStart(4, '0'));
      // eslint-disable-next-line no-await-in-loop -- each fixture file must exist before discovery
      await vfs.writeFile(
        `${path}/${fileName}`,
        encodeV3StorageWrapper(key, new Uint8Array([i + 1])),
      );
    }

    const { fileName: unrelatedFileName, key: unrelatedKey } = createPrimaryV3StorageFileName(
      unrelatedDocumentId,
      '9999',
    );
    await vfs.writeFile(
      `${path}/${unrelatedFileName}`,
      encodeV3StorageWrapper(unrelatedKey, new Uint8Array([99])),
    );
    await vfs.writeFile(`${path}/notes.txt`, new File(['notes'], 'notes.txt'));

    const deleteSpy = vi.spyOn(vfs, 'delete').mockImplementation(async (filePath) => {
      activeDeletes += 1;
      maxConcurrentDeletes = Math.max(maxConcurrentDeletes, activeDeletes);
      deletedPaths.push(filePath);
      await deleteGate;

      activeDeletes -= 1;

      return VirtualFileSystem.prototype.delete.call(vfs, filePath);
    });

    const removePromise = removeDocumentStorageFiles(vfs, path, documentId);

    await vi.waitFor(() => {
      expect(activeDeletes).toBe(maxAllowedConcurrency);
    });

    releaseDeletes();

    await removePromise;

    expect(deleteSpy).toHaveBeenCalledTimes(9);
    expect(maxConcurrentDeletes).toBeLessThanOrEqual(maxAllowedConcurrency);
    expect(maxConcurrentDeletes).toBeGreaterThan(0);
    expect(deletedPaths.every((filePath) => filePath.startsWith(`${path}/`))).toBe(true);
    await expect(getDocumentStorageFiles(vfs, path, documentId)).resolves.toEqual([]);
    await expect(getDocumentStorageFiles(vfs, path, unrelatedDocumentId)).resolves.toHaveLength(1);
    await expect(vfs.readFile(`${path}/${storageAdapterMarkerFileName}`)).resolves.toBeInstanceOf(
      File,
    );
    await expect(vfs.readFile(`${path}/notes.txt`)).resolves.toBeInstanceOf(File);
  });

  it('propagates delete failures other than file-not-found', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const { fileName, key } = createPrimaryV3StorageFileName(documentId, '0001');
    const deleteError = new Error('delete failed');

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(`${path}/${fileName}`, encodeV3StorageWrapper(key, new Uint8Array([1])));

    vi.spyOn(vfs, 'delete').mockRejectedValue(deleteError);

    await expect(removeDocumentStorageFiles(vfs, path, documentId)).rejects.toBe(deleteError);
  });
});

describe('cleanupDeletedDocumentStorageFiles privacy-safe messages', () => {
  it('uses a safe failure message without path, document id, or file names', async () => {
    const documentId = new Repo().create({}).documentId;
    const fileName = partialKeyToFileName([documentId, 'snapshot', 'hash']);
    const path = '/private/repositories/work';

    if (!fileName) {
      throw new Error(`Failed to create repository storage file for "${documentId}"`);
    }

    const vfs = new VirtualFileSystem();
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory('/private');
    await vfs.createDirectory('/private/repositories');
    await vfs.createDirectory(path);
    await vfs.writeFile(`${path}/${fileName}`, new File(['storage'], fileName));

    vi.spyOn(vfs, 'delete').mockImplementation(() => Promise.resolve(undefined));

    const error = await cleanupDeletedDocumentStorageFiles(vfs, path, documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    if (!(error instanceof Error)) {
      throw new Error('Expected cleanupDeletedDocumentStorageFiles to reject with an Error');
    }

    expect(error.message).toBe('Failed to cleanup deleted document storage files');
    expect(error.message).not.toContain(path);
    expect(error.message).not.toContain(documentId);
    expect(error.message).not.toContain(fileName);
  });
});

describe('cleanupDeletedDocumentStorageFiles', () => {
  it('discovers matching files once per non-empty pass, deletes them with bounded concurrency, and preserves unrelated files', async () => {
    const vfs = new VirtualFileSystem();
    const path = '/repo';
    const documentId = new Repo().create({}).documentId;
    const unrelatedDocumentId = new Repo().create({}).documentId;
    const maxAllowedConcurrency = 4;
    let activeDeletes = 0;
    let maxConcurrentDeletes = 0;
    let releaseDeletes!: () => void;
    const deleteGate = new Promise<void>((resolve) => {
      releaseDeletes = resolve;
    });

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);
    await vfs.writeFile(
      `${path}/${storageAdapterMarkerFileName}`,
      new File(['marker'], storageAdapterMarkerFileName),
    );

    for (let i = 0; i < 9; i += 1) {
      const { fileName, key } = createPrimaryV3StorageFileName(documentId, `${i}`.padStart(4, '0'));
      // eslint-disable-next-line no-await-in-loop -- each fixture file must exist before discovery
      await vfs.writeFile(
        `${path}/${fileName}`,
        encodeV3StorageWrapper(key, new Uint8Array([i + 1])),
      );
    }

    const { fileName: unrelatedFileName, key: unrelatedKey } = createPrimaryV3StorageFileName(
      unrelatedDocumentId,
      '9999',
    );
    await vfs.writeFile(
      `${path}/${unrelatedFileName}`,
      encodeV3StorageWrapper(unrelatedKey, new Uint8Array([99])),
    );
    await vfs.writeFile(`${path}/notes.txt`, new File(['notes'], 'notes.txt'));

    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');
    const deleteSpy = vi.spyOn(vfs, 'delete').mockImplementation(async (filePath) => {
      activeDeletes += 1;
      maxConcurrentDeletes = Math.max(maxConcurrentDeletes, activeDeletes);
      await deleteGate;
      activeDeletes -= 1;

      return VirtualFileSystem.prototype.delete.call(vfs, filePath);
    });

    const cleanupPromise = cleanupDeletedDocumentStorageFiles(vfs, path, documentId);

    await vi.waitFor(() => {
      expect(activeDeletes).toBe(maxAllowedConcurrency);
    });

    expect(readDirectorySpy).toHaveBeenCalledTimes(1);

    releaseDeletes();

    await cleanupPromise;

    expect(deleteSpy).toHaveBeenCalledTimes(9);
    expect(maxConcurrentDeletes).toBeLessThanOrEqual(maxAllowedConcurrency);
    expect(maxConcurrentDeletes).toBeGreaterThan(0);
    await expect(getDocumentStorageFiles(vfs, path, documentId)).resolves.toEqual([]);
    await expect(getDocumentStorageFiles(vfs, path, unrelatedDocumentId)).resolves.toHaveLength(1);
    await expect(vfs.readFile(`${path}/${storageAdapterMarkerFileName}`)).resolves.toBeInstanceOf(
      File,
    );
    await expect(vfs.readFile(`${path}/${unrelatedFileName}`)).resolves.toBeInstanceOf(File);
    await expect(vfs.readFile(`${path}/notes.txt`)).resolves.toBeInstanceOf(File);
  });
});
