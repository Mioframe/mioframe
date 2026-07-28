export type ManagedReleaseChannel = 'stable' | 'develop';

export type ManagedReleaseDescriptor = {
  schemaVersion: number;
  releaseId: string;
  releaseSequence: number;
  appVersion: string;
  buildId: string;
  buildDate: string;
  indexUrl: string;
  files: { path: string; sha256: string; byteSize: number }[];
};

export declare function buildAndPublishManagedRelease(options: {
  channel: ManagedReleaseChannel;
  basePath: string;
  appVersion: string;
  buildId: string;
  workDir: string;
  extraEnv?: Record<string, string>;
}): Promise<ManagedReleaseDescriptor>;

export declare function buildAndApplyLegacyStableDeploy(options: {
  workDir: string;
}): Promise<void>;

export declare function buildAndPublishBrokenManagedRelease(options: {
  channel: ManagedReleaseChannel;
  basePath: string;
  appVersion: string;
  buildId: string;
  workDir: string;
  extraEnv?: Record<string, string>;
}): Promise<ManagedReleaseDescriptor>;

export type ManagedArtifactServerHandle = {
  url: string;
  close: () => Promise<void>;
};

export declare function startManagedArtifactServer(options: {
  workDir: string;
  basePath: string;
  host?: string;
  port?: number;
}): Promise<ManagedArtifactServerHandle>;
