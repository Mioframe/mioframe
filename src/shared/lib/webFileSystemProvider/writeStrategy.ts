import type { DiagnosticsMode } from '@shared/config';

/** Internal write-path strategy for user-selected web file system writes. */
export type WebFileSystemWriteStrategy = 'directCreateWriteProbe' | 'safeCurrent';

/** Default production-safe write strategy. */
export const DEFAULT_WEB_FILE_SYSTEM_WRITE_STRATEGY: WebFileSystemWriteStrategy = 'safeCurrent';

/**
 * Normalizes a configured diagnostic write strategy to a supported internal value.
 * Preview/diagnostic builds may opt into the direct legacy probe; all other inputs fall back
 * to the default safe path.
 * @param root0 - Raw configured strategy plus shared build diagnostics mode.
 * @returns Safe normalized provider write strategy.
 */
export const resolveWebFileSystemWriteStrategy = ({
  configuredStrategy,
  diagnosticsMode,
}: {
  configuredStrategy: string;
  diagnosticsMode: DiagnosticsMode;
}): WebFileSystemWriteStrategy =>
  diagnosticsMode === 'preview' && configuredStrategy === 'directCreateWriteProbe'
    ? 'directCreateWriteProbe'
    : DEFAULT_WEB_FILE_SYSTEM_WRITE_STRATEGY;
