/** Internal write-path strategy for user-selected web file system writes. */
export type WebFileSystemWriteStrategy = 'directCreateWriteProbe' | 'safeCurrent';

/** Default write strategy used for non-user-selected paths (e.g. OPFS). */
export const DEFAULT_WEB_FILE_SYSTEM_WRITE_STRATEGY: WebFileSystemWriteStrategy = 'safeCurrent';
