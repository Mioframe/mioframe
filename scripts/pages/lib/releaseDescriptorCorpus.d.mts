/** One named test case in the shared publisher/runtime release-descriptor validation corpus. */
export type ReleaseDescriptorCorpusCase = {
  /** Human-readable case description used as the test title. */
  name: string;
  /** Untrusted parsed descriptor JSON under test. */
  value: unknown;
};

/** Descriptors both the publisher and runtime validators must accept. */
export const validReleaseDescriptors: ReleaseDescriptorCorpusCase[];
/** Descriptors both the publisher and runtime validators must reject. */
export const invalidReleaseDescriptors: ReleaseDescriptorCorpusCase[];
