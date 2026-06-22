/** Primitive value allowed in safe structured diagnostic details. */
export type SafeDiagnosticDetailValue = string | number | boolean | null;

/** Flat record of safe structured diagnostic details, all primitive values. */
export type SafeDiagnosticDetails = Record<string, SafeDiagnosticDetailValue>;

const isSafeDiagnosticDetailValue = (value: unknown): value is SafeDiagnosticDetailValue =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean' ||
  value === null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSafeDiagnosticDetails = (value: unknown): value is SafeDiagnosticDetails =>
  isRecord(value) && Object.values(value).every(isSafeDiagnosticDetailValue);

interface HasSafeDiagnosticDetails {
  safeDetails: SafeDiagnosticDetails;
}

const hasSafeDiagnosticDetails = (error: unknown): error is HasSafeDiagnosticDetails =>
  isRecord(error) && 'safeDetails' in error && isSafeDiagnosticDetails(error.safeDetails);

/**
 * Reads opt-in safe diagnostic details carried by an error or its direct cause.
 * Duck-typed and provider-agnostic: callers never need to know which boundary attached the
 * details. Looks at most one level into `cause` so this stays a thin generic carrier rather than
 * a cause-chain classifier.
 * @param error - The caught value to inspect.
 * @returns Safe diagnostic details when present, otherwise undefined.
 */
export const getSafeDiagnosticDetails = (error: unknown): SafeDiagnosticDetails | undefined => {
  if (hasSafeDiagnosticDetails(error)) {
    return error.safeDetails;
  }

  if (error instanceof Error && hasSafeDiagnosticDetails(error.cause)) {
    return error.cause.safeDetails;
  }

  return undefined;
};
