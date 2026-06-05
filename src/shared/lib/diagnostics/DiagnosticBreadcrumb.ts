/**
 * Allowed categories for safe technical diagnostic breadcrumbs.
 * These are project-controlled; automatic browser/Sentry categories are stripped.
 */
export type DiagnosticBreadcrumbCategory =
  | 'repository.storage'
  | 'writeAccessRecovery'
  | 'diagnostics.forwarding';

/**
 * Allowed keys in `DiagnosticBreadcrumb.data`.
 * Values must be enum-like strings or numbers — no paths, ids, names, URLs, or user data.
 */
export type DiagnosticBreadcrumbDataKey =
  | 'provider'
  | 'operation'
  | 'result'
  | 'classification'
  | 'failureClassification'
  | 'pendingCount'
  | 'flushedCount'
  | 'failedCount';

/**
 * Safe technical diagnostic breadcrumb.
 *
 * Must describe a technical feature step, not user behavior.
 * `category` must be a project-controlled enum value from `DiagnosticBreadcrumbCategory`.
 * `message` must be a stable project-controlled constant string.
 * `data` keys and values must be project-controlled enum-like strings or numbers only.
 *
 * Forbidden in `data`: path, file name, directory name, space name, document id,
 * document name, storage key, URL, raw error message, raw cause, bytes, document content,
 * or user-entered text.
 */
export interface DiagnosticBreadcrumb {
  /** Project-controlled category from the allowed set. */
  category: DiagnosticBreadcrumbCategory;
  /** Stable project-controlled human-readable description. */
  message: string;
  /** Optional Sentry level for this breadcrumb. */
  level?: 'debug' | 'info' | 'warning' | 'error';
  /** Optional safe numeric or enum-like string context. */
  data?: Partial<Record<DiagnosticBreadcrumbDataKey, string | number>>;
}
