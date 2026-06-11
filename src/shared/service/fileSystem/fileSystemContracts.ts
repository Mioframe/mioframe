export {
  DEVICE_FILES_ROOT_NAME,
  type DeviceFileDisplayRecord,
} from '@shared/lib/deviceFileSystemProvider';

/**
 * UI-facing options for reading directory content through the shared file-system service.
 */
export interface ReadDirectoryOptions {
  /** Hides Automerge sidecar files from the returned listing. */
  hideAutomergeFiles?: boolean;
}
