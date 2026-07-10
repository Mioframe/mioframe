import { FSNodeType, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { createZipArchiveReader, streamBlobChunks } from '@shared/lib/zipArchive';
import type { ZipImportRecoveryContext, ZipImportResult } from './repositoryZipContracts';
import type {
  PlannedZipEntry,
  ZipImportExecutablePlan,
  ZipImportPlan,
} from './repositoryZipImportPlanning';

const streamArchiveInto = async (
  archiveFile: File,
  push: (chunk: Uint8Array, final: boolean) => Promise<void>,
): Promise<void> => {
  let buffered: Uint8Array | undefined;
  for await (const chunk of streamBlobChunks(archiveFile)) {
    if (buffered) await push(buffered, false);
    buffered = chunk;
  }
  await push(buffered ?? new Uint8Array(0), true);
};

/**
 * Incrementally compares two byte streams without assuming matching chunk boundaries.
 * @param expected - Expected byte stream.
 * @param actual - Actual byte stream.
 * @returns Whether both streams contain exactly the same bytes and length.
 */
export const compareByteStreams = async (
  expected: AsyncIterable<Uint8Array>,
  actual: AsyncIterable<Uint8Array>,
): Promise<boolean> => {
  const expectedIterator = expected[Symbol.asyncIterator]();
  const actualIterator = actual[Symbol.asyncIterator]();
  let expectedChunk = await expectedIterator.next();
  let actualChunk = await actualIterator.next();
  let expectedOffset = 0;
  let actualOffset = 0;

  while (!expectedChunk.done && !actualChunk.done) {
    const count = Math.min(
      expectedChunk.value.byteLength - expectedOffset,
      actualChunk.value.byteLength - actualOffset,
    );
    for (let index = 0; index < count; index += 1) {
      if (expectedChunk.value[expectedOffset + index] !== actualChunk.value[actualOffset + index]) {
        return false;
      }
    }
    expectedOffset += count;
    actualOffset += count;
    if (expectedOffset === expectedChunk.value.byteLength) {
      // eslint-disable-next-line no-await-in-loop -- sequential stream reads keep memory bounded
      expectedChunk = await expectedIterator.next();
      expectedOffset = 0;
    }
    if (actualOffset === actualChunk.value.byteLength) {
      // eslint-disable-next-line no-await-in-loop -- sequential stream reads keep memory bounded
      actualChunk = await actualIterator.next();
      actualOffset = 0;
    }
  }
  return expectedChunk.done === true && actualChunk.done === true;
};

const fileChunks = async function* (file: File): AsyncIterable<Uint8Array> {
  const reader = file.stream().getReader();
  try {
    for (;;) {
      // eslint-disable-next-line no-await-in-loop -- one reader chunk is retained at a time
      const next = await reader.read();
      if (next.done) return;
      yield next.value;
    }
  } finally {
    reader.releaseLock();
  }
};

const compareArchiveEntryWithFile = async (
  archiveFile: File,
  archivePath: string,
  targetFile: File,
): Promise<boolean> => {
  const targetIterator = fileChunks(targetFile)[Symbol.asyncIterator]();
  let targetChunk = await targetIterator.next();
  let targetOffset = 0;
  let matches = true;
  const reader = createZipArchiveReader((entry) => {
    if (entry.rawPath !== archivePath) return;
    entry.read(async (archiveChunk, final) => {
      let archiveOffset = 0;
      while (matches && archiveOffset < archiveChunk.byteLength) {
        if (targetChunk.done) {
          matches = false;
          break;
        }
        const count = Math.min(
          archiveChunk.byteLength - archiveOffset,
          targetChunk.value.byteLength - targetOffset,
        );
        for (let index = 0; index < count; index += 1) {
          if (archiveChunk[archiveOffset + index] !== targetChunk.value[targetOffset + index]) {
            matches = false;
            break;
          }
        }
        archiveOffset += count;
        targetOffset += count;
        if (targetOffset === targetChunk.value.byteLength) {
          // eslint-disable-next-line no-await-in-loop -- comparison advances one target chunk at a time
          targetChunk = await targetIterator.next();
          targetOffset = 0;
        }
      }
      if (final && matches) {
        matches = targetChunk.done === true;
      }
    });
  });
  await streamArchiveInto(archiveFile, (chunk, final) => reader.push(chunk, final));
  return matches;
};

/** Recovery verification output ready for the execution phase. */
export type ZipImportRecoveryResolution = {
  /** Execution plan after recovery classification. */
  executable: ZipImportExecutablePlan;
  /** Existing uncertain files proven byte-identical to the archive. */
  verifiedFiles: number;
};

/**
 * Verifies the service-issued uncertain entry before any retry mutation occurs.
 * @param vfs - Target virtual filesystem.
 * @param archiveFile - Fully validated archive selected by the user.
 * @param plan - Validated archive plan.
 * @param executable - Preflighted no-overwrite execution plan.
 * @param recovery - Service-issued recovery identity, when retrying a partial import.
 * @returns A safe execution resolution or an expected unresolved-recovery result.
 */
export const resolveZipImportRecovery = async (
  vfs: VirtualFileSystem,
  archiveFile: File,
  plan: ZipImportPlan,
  executable: ZipImportExecutablePlan,
  recovery: ZipImportRecoveryContext | undefined,
): Promise<ZipImportResult | ZipImportRecoveryResolution> => {
  const uncertain = recovery?.uncertainEntry;
  if (!uncertain) return { executable, verifiedFiles: 0 };
  const entries: PlannedZipEntry[] = [...plan.directories, ...plan.files];
  const planned = entries.find((entry) => entry.relativePath === uncertain.relativePath);
  if (!planned || planned.kind !== uncertain.kind) {
    throw new Error('Recovery context must be validated by the import orchestrator');
  }
  const existingType = executable.existingTypes.get(planned.targetPath);
  if (existingType === undefined) return { executable, verifiedFiles: 0 };
  if (
    (planned.kind === 'file' && existingType !== FSNodeType.File) ||
    (planned.kind === 'directory' && existingType !== FSNodeType.Directory)
  ) {
    return {
      status: 'recoveryUnresolved',
      report: { relativePath: planned.relativePath, reason: 'typeMismatch' },
    };
  }
  if (planned.kind === 'directory') return { executable, verifiedFiles: 0 };

  const matches = await compareArchiveEntryWithFile(
    archiveFile,
    planned.archivePath,
    await vfs.readFile(planned.targetPath),
  );
  if (!matches) {
    return {
      status: 'recoveryUnresolved',
      report: { relativePath: planned.relativePath, reason: 'contentMismatch' },
    };
  }
  return {
    executable: { ...executable, skippedFiles: Math.max(0, executable.skippedFiles - 1) },
    verifiedFiles: 1,
  };
};
