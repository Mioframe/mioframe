import { fileSave } from 'browser-fs-access';
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
