/* eslint-disable jsdoc/require-jsdoc -- Exported Zod schemas and discriminated DTO field names are the protocol documentation. */
import { z } from 'zod';

export const RELEASE_CONTROLLER_SCHEMA_VERSION = 1;
export const RELEASE_PROTOCOL_VERSION = 1;

export const releaseIdentitySchema = z.object({
  releaseId: z.string().regex(/^[0-9a-f]{40}$/),
  appVersion: z.string().min(1),
  buildId: z.string().min(1),
  buildDate: z.iso.datetime(),
});

export type ReleaseIdentity = z.infer<typeof releaseIdentitySchema>;

export const releaseFileSchema = z.object({
  url: z.string().startsWith('/'),
  byteSize: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export type ReleaseFile = z.infer<typeof releaseFileSchema>;

export const releaseDescriptorSchema = z.object({
  schemaVersion: z.literal(RELEASE_CONTROLLER_SCHEMA_VERSION),
  releaseId: releaseIdentitySchema.shape.releaseId,
  appVersion: releaseIdentitySchema.shape.appVersion,
  buildId: releaseIdentitySchema.shape.buildId,
  buildDate: releaseIdentitySchema.shape.buildDate,
  indexUrl: z.string().startsWith('/updates/releases/'),
  files: z.array(releaseFileSchema).min(1),
});

export type ReleaseDescriptor = z.infer<typeof releaseDescriptorSchema>;

export const latestReleaseSchema = z.object({
  schemaVersion: z.literal(RELEASE_CONTROLLER_SCHEMA_VERSION),
  release: releaseIdentitySchema,
  descriptorUrl: z.string().startsWith('/updates/releases/'),
});

export type LatestRelease = z.infer<typeof latestReleaseSchema>;

export const updateModeSchema = z.enum(['automatic', 'manual']);
export type UpdateMode = z.infer<typeof updateModeSchema>;

export const releaseControllerStateSchema = z.object({
  schemaVersion: z.literal(RELEASE_CONTROLLER_SCHEMA_VERSION),
  mode: updateModeSchema,
  activeRelease: releaseIdentitySchema,
  pinnedRelease: releaseIdentitySchema.optional(),
  candidateRelease: releaseIdentitySchema.optional(),
  previousRelease: releaseIdentitySchema.optional(),
  bootAttempt: releaseIdentitySchema.optional(),
  bootNavigationServed: z.boolean().optional(),
  bootExpectedClientIds: z.array(z.string()).optional(),
  failedReleaseId: releaseIdentitySchema.shape.releaseId.optional(),
  confirmedLatestRelease: releaseIdentitySchema.optional(),
  lastSuccessfulCheckAt: z.iso.datetime().optional(),
});

export type ReleaseControllerState = z.infer<typeof releaseControllerStateSchema>;

export type AppUpdateErrorCode =
  | 'capabilityUnavailable'
  | 'checkFailed'
  | 'prepareFailed'
  | 'restartBusy'
  | 'restartUnresponsive'
  | 'invalidResponse'
  | 'unsupportedProtocol';

export type AppUpdateOutcome =
  | { status: 'ok'; state: ReleaseControllerState }
  | {
      status: 'blocked';
      code: 'restartBusy' | 'restartUnresponsive';
      state: ReleaseControllerState;
    }
  | { status: 'error'; code: AppUpdateErrorCode; state?: ReleaseControllerState };

export type ReleaseControllerCommand =
  | { protocolVersion: 1; type: 'GET_STATE' }
  | { protocolVersion: 1; type: 'CHECK' }
  | { protocolVersion: 1; type: 'SET_AUTOMATIC'; enabled: boolean; runningReleaseId: string }
  | { protocolVersion: 1; type: 'PREPARE_LATEST' }
  | { protocolVersion: 1; type: 'ACTIVATE' }
  | { protocolVersion: 1; type: 'BOOT_OK'; releaseId: string };

export const releaseControllerCommandSchema = z.discriminatedUnion('type', [
  z.object({ protocolVersion: z.literal(1), type: z.literal('GET_STATE') }),
  z.object({ protocolVersion: z.literal(1), type: z.literal('CHECK') }),
  z.object({
    protocolVersion: z.literal(1),
    type: z.literal('SET_AUTOMATIC'),
    enabled: z.boolean(),
    runningReleaseId: releaseIdentitySchema.shape.releaseId,
  }),
  z.object({ protocolVersion: z.literal(1), type: z.literal('PREPARE_LATEST') }),
  z.object({ protocolVersion: z.literal(1), type: z.literal('ACTIVATE') }),
  z.object({
    protocolVersion: z.literal(1),
    type: z.literal('BOOT_OK'),
    releaseId: releaseIdentitySchema.shape.releaseId,
  }),
]);

export type ReleaseControllerResponse = AppUpdateOutcome;
/* eslint-enable jsdoc/require-jsdoc -- End schema-defined protocol DTOs. */
