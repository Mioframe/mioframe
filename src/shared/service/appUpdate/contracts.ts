import { z } from 'zod';
import type {
  AppUpdateActionResult,
  AppUpdatePublicErrorCode,
  AppUpdateSnapshot,
} from './publicContracts';

/** Private wire-format version for published release descriptors and the latest pointer. */
export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 2;
/** Private persisted controller-state schema version. */
export const RELEASE_CONTROLLER_SCHEMA_VERSION = 3;
/** Private worker transport protocol version. */
export const RELEASE_PROTOCOL_VERSION = 3;

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
  schemaVersion: z.literal(RELEASE_DESCRIPTOR_SCHEMA_VERSION),
  indexUrl: z.string().min(1),
  files: z.array(releaseFileSchema).min(1),
});
/** Private immutable release descriptor. */
export type ReleaseDescriptor = z.infer<typeof releaseDescriptorSchema>;

/** Private latest-pointer validator. */
export const latestReleaseSchema = z.object({
  schemaVersion: z.literal(RELEASE_DESCRIPTOR_SCHEMA_VERSION),
  release: releaseIdentitySchema,
  descriptorUrl: z.string().min(1),
});
/** Private validated latest pointer. */
export type LatestRelease = z.infer<typeof latestReleaseSchema>;

/** Private persisted mode validator. */
export const updateModeSchema = z.enum(['automatic', 'manual']);
/** Private persisted mode. */
export type UpdateMode = z.infer<typeof updateModeSchema>;

/** Private persisted single-window trial validator. */
export const trialSchema = z.object({
  targetRelease: releaseIdentitySchema,
  previousRelease: releaseIdentitySchema,
  startedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  initiatingClientId: z.string().optional(),
});
/** Private persisted single-window trial. */
export type Trial = z.infer<typeof trialSchema>;

/** Private persisted metadata-check status, always naming its own operation when running. */
export const checkStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('idle'), lastSuccessAt: z.iso.datetime().optional() }),
  z.object({
    status: z.literal('running'),
    operationId: z.string().min(1),
    startedAt: z.iso.datetime(),
    lastSuccessAt: z.iso.datetime().optional(),
  }),
  z.object({ status: z.literal('failed'), lastSuccessAt: z.iso.datetime().optional() }),
]);
/** Private persisted metadata-check status. */
export type CheckStatus = z.infer<typeof checkStatusSchema>;

/** Private persisted release-preparation status, always naming its own target. */
export const preparationStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('idle') }),
  z.object({
    status: z.literal('running'),
    release: releaseIdentitySchema,
    operationId: z.string().min(1),
    startedAt: z.iso.datetime(),
  }),
  z.object({ status: z.literal('ready'), release: releaseIdentitySchema }),
  z.object({ status: z.literal('failed'), release: releaseIdentitySchema }),
]);
/** Private persisted release-preparation status. */
export type PreparationStatus = z.infer<typeof preparationStatusSchema>;

/** Private persisted controller-state validator. */
export const releaseControllerStateSchema = z.object({
  schemaVersion: z.literal(RELEASE_CONTROLLER_SCHEMA_VERSION),
  mode: updateModeSchema,
  activeRelease: releaseIdentitySchema,
  pinnedRelease: releaseIdentitySchema.optional(),
  latestRelease: releaseIdentitySchema.optional(),
  trial: trialSchema.optional(),
  failedReleaseIds: z.array(releaseIdentitySchema.shape.releaseId).default([]),
  check: checkStatusSchema,
  preparation: preparationStatusSchema,
  errorCode: z.custom<AppUpdatePublicErrorCode>().optional(),
});
/** Private persisted controller state. */
export type ReleaseControllerState = z.infer<typeof releaseControllerStateSchema>;

/** Private worker command transport. */
export type ReleaseControllerCommand =
  | {
      /** Protocol discriminator. */ protocolVersion: 3;
      /** Command kind. */ type: 'GET_SNAPSHOT';
    }
  | {
      /** Protocol discriminator. */ protocolVersion: 3;
      /** Command kind. */ type: 'CHECK_FOR_UPDATES';
    }
  | {
      /** Protocol discriminator. */ protocolVersion: 3;
      /** Command kind. */ type: 'SET_MODE';
      /** Requested mode. */ mode: UpdateMode;
    }
  | { /** Protocol discriminator. */ protocolVersion: 3; /** Command kind. */ type: 'UPDATE_NOW' }
  | {
      /** Protocol discriminator. */ protocolVersion: 3;
      /** Command kind. */ type: 'PRIVATE_BOOT_READY';
      /** Privately detected running release. */ releaseId: string;
    };

/** Private worker command validator. */
export const releaseControllerCommandSchema = z.discriminatedUnion('type', [
  z.object({ protocolVersion: z.literal(3), type: z.literal('GET_SNAPSHOT') }),
  z.object({ protocolVersion: z.literal(3), type: z.literal('CHECK_FOR_UPDATES') }),
  z.object({
    protocolVersion: z.literal(3),
    type: z.literal('SET_MODE'),
    mode: updateModeSchema,
  }),
  z.object({ protocolVersion: z.literal(3), type: z.literal('UPDATE_NOW') }),
  z.object({
    protocolVersion: z.literal(3),
    type: z.literal('PRIVATE_BOOT_READY'),
    releaseId: releaseIdentitySchema.shape.releaseId,
  }),
]);

/**
 * Private worker transport response, shared between the controller and its client so the client
 * never has to import controller implementation to type its own transport handling.
 */
export type ControllerResponse =
  | {
      /** Response discriminator. */ kind: 'snapshot';
      /** UI-safe state. */ snapshot: AppUpdateSnapshot;
    }
  | {
      /** Response discriminator. */ kind: 'action';
      /** Immediate action result. */ result: AppUpdateActionResult;
    };
