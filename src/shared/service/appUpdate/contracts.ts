import { z } from 'zod';
import type { AppUpdatePublicErrorCode } from './publicContracts';

/** Private persisted controller schema version. */
export const RELEASE_CONTROLLER_SCHEMA_VERSION = 2;
/** Private worker transport protocol version. */
export const RELEASE_PROTOCOL_VERSION = 2;

/** Private immutable release identity validator. */
export const releaseIdentitySchema = z.object({
  releaseId: z.string().regex(/^[0-9a-f]{40}$/),
  releaseSequence: z.number().int().positive(),
  appVersion: z.string().min(1),
  buildId: z.string().min(1),
  buildDate: z.iso.datetime(),
});
/** Private immutable release identity. */
export type ReleaseIdentity = z.infer<typeof releaseIdentitySchema>;

/** Private immutable release-file validator. */
export const releaseFileSchema = z.object({
  url: z.string().min(1),
  byteSize: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});
/** Private immutable release-file record. */
export type ReleaseFile = z.infer<typeof releaseFileSchema>;

/** Private immutable release-descriptor validator. */
export const releaseDescriptorSchema = releaseIdentitySchema.extend({
  schemaVersion: z.literal(RELEASE_CONTROLLER_SCHEMA_VERSION),
  indexUrl: z.string().min(1),
  files: z.array(releaseFileSchema).min(1),
});
/** Private immutable release descriptor. */
export type ReleaseDescriptor = z.infer<typeof releaseDescriptorSchema>;

/** Private latest-pointer validator. */
export const latestReleaseSchema = z.object({
  schemaVersion: z.literal(RELEASE_CONTROLLER_SCHEMA_VERSION),
  release: releaseIdentitySchema,
  descriptorUrl: z.string().min(1),
});
/** Private validated latest pointer. */
export type LatestRelease = z.infer<typeof latestReleaseSchema>;

/** Private persisted mode validator. */
export const updateModeSchema = z.enum(['automatic', 'manual']);
/** Private persisted mode. */
export type UpdateMode = z.infer<typeof updateModeSchema>;

const activationTransactionSchema = z.object({
  transactionId: z.string().min(1),
  targetRelease: releaseIdentitySchema,
  previousRelease: releaseIdentitySchema,
  expectedOldClientIds: z.array(z.string()),
  replacements: z.record(z.string(), z.string()),
  confirmedReplacementClientIds: z.array(z.string()),
  acceptsSingleLaunch: z.boolean(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
});
/** Private persisted activation transaction. */
export type ActivationTransaction = z.infer<typeof activationTransactionSchema>;

/** Private persisted controller-state validator. */
export const releaseControllerStateSchema = z.object({
  schemaVersion: z.literal(RELEASE_CONTROLLER_SCHEMA_VERSION),
  mode: updateModeSchema,
  activeRelease: releaseIdentitySchema,
  pinnedRelease: releaseIdentitySchema.optional(),
  preparedRelease: releaseIdentitySchema.optional(),
  previousRelease: releaseIdentitySchema.optional(),
  confirmedLatestRelease: releaseIdentitySchema.optional(),
  failedReleaseIds: z.array(releaseIdentitySchema.shape.releaseId).default([]),
  activationTransaction: activationTransactionSchema.optional(),
  checkState: z.enum(['notChecked', 'checking', 'succeeded', 'failed']),
  preparationState: z.enum(['idle', 'preparing', 'ready', 'failed']),
  activationState: z.enum([
    'idle',
    'waitingForSafeLaunch',
    'blockedByActivity',
    'blockedByWindow',
    'restarting',
  ]),
  checkOperationId: z.string().optional(),
  preparationOperationId: z.string().optional(),
  activationRequested: z.boolean().optional(),
  lastSuccessfulCheckAt: z.iso.datetime().optional(),
  errorCode: z.custom<AppUpdatePublicErrorCode>().optional(),
  capabilityUnavailable: z.boolean().optional(),
});
/** Private persisted controller state. */
export type ReleaseControllerState = z.infer<typeof releaseControllerStateSchema>;

/** Private worker command transport. */
export type ReleaseControllerCommand =
  | { /** Protocol discriminator. */ protocolVersion: 2; /** Command kind. */ type: 'GET_SNAPSHOT' }
  | {
      /** Protocol discriminator. */ protocolVersion: 2;
      /** Command kind. */ type: 'CHECK_FOR_UPDATES';
    }
  | {
      /** Protocol discriminator. */ protocolVersion: 2;
      /** Command kind. */ type: 'SET_MODE';
      /** Requested mode. */ mode: UpdateMode;
    }
  | { /** Protocol discriminator. */ protocolVersion: 2; /** Command kind. */ type: 'UPDATE_NOW' }
  | {
      /** Protocol discriminator. */ protocolVersion: 2;
      /** Command kind. */ type: 'PRIVATE_BOOT_READY';
      /** Privately detected running release. */ releaseId: string;
    };

/** Private worker command validator. */
export const releaseControllerCommandSchema = z.discriminatedUnion('type', [
  z.object({ protocolVersion: z.literal(2), type: z.literal('GET_SNAPSHOT') }),
  z.object({ protocolVersion: z.literal(2), type: z.literal('CHECK_FOR_UPDATES') }),
  z.object({
    protocolVersion: z.literal(2),
    type: z.literal('SET_MODE'),
    mode: updateModeSchema,
  }),
  z.object({ protocolVersion: z.literal(2), type: z.literal('UPDATE_NOW') }),
  z.object({
    protocolVersion: z.literal(2),
    type: z.literal('PRIVATE_BOOT_READY'),
    releaseId: releaseIdentitySchema.shape.releaseId,
  }),
]);
