import { DomainError } from '@shared/lib/error';

/**
 * Stable code for remembered local-space access recovery.
 */
export const DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE = 'device-directory-access-required';

/**
 * Permission mode required to continue a blocked local-space operation.
 */
export type DeviceDirectoryAccessMode = 'readwrite';

/**
 * Serialized transport payload for a remembered local-space access-required error.
 */
export type SerializedDeviceDirectoryAccessRequiredError = {
  /** Optional safe cause. */
  cause?: unknown;
  /** Stable machine-readable code. */
  code: typeof DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE;
  /** Safe user-facing message. */
  message: string;
  /** Permission mode that must be granted. */
  mode: DeviceDirectoryAccessMode;
  /** Error class name. */
  name: string;
  /** Runtime access request identifier. */
  requestId: string;
  /** Remembered local-space name shown to the user. */
  spaceName: string;
  /** Optional stack trace. */
  stack?: string | undefined;
};

/**
 * Service-transfer-safe error raised when a remembered local space needs browser permission.
 */
export class DeviceDirectoryAccessRequiredError extends DomainError<
  typeof DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE
> {
  override name = 'DeviceDirectoryAccessRequiredError';
  override readonly code = DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE;
  readonly requestId: string;
  readonly spaceName: string;
  readonly mode: DeviceDirectoryAccessMode;

  /**
   * Creates an access-required error from runtime details or serialized transport data.
   * @param options - Safe transport data for the current access request.
   */
  constructor(
    options:
      | {
          mode: DeviceDirectoryAccessMode;
          requestId: string;
          spaceName: string;
        }
      | SerializedDeviceDirectoryAccessRequiredError,
  ) {
    if ('name' in options) {
      super(options);
      this.requestId = options.requestId;
      this.spaceName = options.spaceName;
      this.mode = options.mode;
      return;
    }

    super('Permission required to open this remembered local space', {
      code: DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE,
    });
    this.requestId = options.requestId;
    this.spaceName = options.spaceName;
    this.mode = options.mode;
  }

  /**
   * Serializes the access-required error for worker transport.
   * @returns Service-transfer-safe error payload.
   */
  override toJSON(): SerializedDeviceDirectoryAccessRequiredError {
    return {
      ...super.toJSON(),
      code: this.code,
      mode: this.mode,
      name: this.name,
      requestId: this.requestId,
      spaceName: this.spaceName,
    };
  }
}
