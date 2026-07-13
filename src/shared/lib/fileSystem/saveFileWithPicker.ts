import { fileSave } from 'browser-fs-access';
import { DomainError } from '@shared/lib/error';
import { FileSystemDomainErrorCode } from './fileSystemErrorCode';
import { isUserFileSelectionCancel } from './isUserFileSelectionCancel';

type SaveFileExtension = `.${string}`;
type SaveFileMimeType = `${string}/${string}`;

/**
 * Low-level save-picker options used by shared browser file save helpers.
 */
export interface SaveFileWithPickerOptions {
  /** Suggested file name shown by the save picker. */
  fileName: string;
  /** Allowed file extensions for the chosen file type. */
  extensions: SaveFileExtension[];
  /** Allowed MIME types for the chosen file type. */
  mimeTypes: SaveFileMimeType[];
  /** Optional picker description for the file type filter. */
  description?: string;
}

const toBlob = async (value: Blob | Response) => {
  if (value instanceof Response) {
    return await value.blob();
  }

  return value;
};

const buildAcceptMap = ({ extensions, mimeTypes }: SaveFileWithPickerOptions) => {
  return mimeTypes.reduce<Record<SaveFileMimeType, SaveFileExtension[]>>((accept, mimeType) => {
    accept[mimeType] = extensions;
    return accept;
  }, {});
};

/**
 * Starts browser save target acquisition immediately, then writes asynchronously prepared content.
 * Returns `false` when the user cancels the save flow.
 * @param createBlob - Produces the file content after save target acquisition starts.
 * @param options - Save picker options.
 * @returns `true` when the file is written, or `false` when the user cancels the picker.
 */
export const saveFileWithPicker = async (
  createBlob: () => Promise<Blob | Response>,
  options: SaveFileWithPickerOptions,
) => {
  try {
    if (typeof globalThis.showSaveFilePicker === 'function') {
      const handle = await globalThis.showSaveFilePicker({
        suggestedName: options.fileName,
        types: [
          {
            description: options.description ?? '',
            accept: buildAcceptMap(options),
          },
        ],
      });
      const writable = await handle.createWritable();

      try {
        await writable.write(await toBlob(await createBlob()));
        await writable.close();
      } catch (error) {
        await writable.abort().catch(() => undefined);
        throw error;
      }

      return true;
    }

    const contentPromise = Promise.resolve()
      .then(() => createBlob())
      .then((value) => toBlob(value));
    const fallbackOptions = {
      fileName: options.fileName,
      extensions: options.extensions,
      mimeTypes: options.mimeTypes,
      ...(options.description === undefined ? {} : { description: options.description }),
    };

    try {
      await fileSave(contentPromise, fallbackOptions);
      await contentPromise;
    } catch (error) {
      void contentPromise.catch(() => undefined);
      throw error;
    }

    return true;
  } catch (error) {
    if (isUserFileSelectionCancel(error)) {
      return false;
    }

    throw error;
  }
};

/**
 * Options for {@link saveStreamWithPicker}.
 */
export interface SaveStreamWithPickerOptions extends SaveFileWithPickerOptions {
  /**
   * Maximum total bytes buffered when writing through the Blob-based fallback path (used when
   * the browser has no File System Access API and content can't be streamed straight to disk).
   */
  maxFallbackBytes: number;
}

/**
 * Starts browser save target acquisition immediately, then streams produced chunks to it as they
 * become available, instead of collecting the full content into one in-memory value first.
 *
 * When the File System Access API is available, chunks are written straight to the picked file
 * as `produce` yields them, so content never needs to be fully buffered. Otherwise, chunks are
 * buffered up to `maxFallbackBytes` for the fallback save path; exceeding that bound throws a
 * `DomainError` with code `FileSystemDomainErrorCode.saveStreamFallbackTooLarge`.
 * @param produce - Called with a `write` function; invoke it with each chunk to save, in order.
 * @param options - Save picker options plus the fallback-path size bound.
 * @returns `true` when the file is written, or `false` when the user cancels the picker.
 */
export const saveStreamWithPicker = async (
  produce: (write: (chunk: Uint8Array) => Promise<void>) => Promise<void>,
  options: SaveStreamWithPickerOptions,
) => {
  try {
    if (typeof globalThis.showSaveFilePicker === 'function') {
      const handle = await globalThis.showSaveFilePicker({
        suggestedName: options.fileName,
        types: [
          {
            description: options.description ?? '',
            accept: buildAcceptMap(options),
          },
        ],
      });
      const writable = await handle.createWritable();

      try {
        await produce(async (chunk) => {
          // FileSystemWritableFileStream demands an ArrayBuffer-backed view; our chunks are
          // never SharedArrayBuffer-backed, so this narrows a platform typing gap, not behavior.
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrows ArrayBufferLike to the stricter ArrayBuffer view FileSystemWritableFileStream requires
          await writable.write(chunk as Uint8Array<ArrayBuffer>);
        });
        await writable.close();
      } catch (error) {
        await writable.abort().catch(() => undefined);
        throw error;
      }

      return true;
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    await produce(async (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > options.maxFallbackBytes) {
        throw new DomainError(
          "This browser can't save a file this large without native file-system access. Try a smaller export, or use a browser with file-system access support.",
          { code: FileSystemDomainErrorCode.saveStreamFallbackTooLarge },
        );
      }

      chunks.push(chunk);
      await Promise.resolve();
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrows ArrayBufferLike to the stricter ArrayBuffer view Blob's BlobPart requires
    const blob = new Blob(chunks as Uint8Array<ArrayBuffer>[], {
      type: options.mimeTypes[0] ?? '',
    });
    const fallbackOptions = {
      fileName: options.fileName,
      extensions: options.extensions,
      mimeTypes: options.mimeTypes,
      ...(options.description === undefined ? {} : { description: options.description }),
    };

    await fileSave(blob, fallbackOptions);

    return true;
  } catch (error) {
    if (isUserFileSelectionCancel(error)) {
      return false;
    }

    throw error;
  }
};
