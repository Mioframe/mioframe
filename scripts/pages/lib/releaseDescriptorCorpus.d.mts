/** Structurally valid `ReleaseDescriptor`-shaped fixture (kept untyped/plain here; validated against the real schema by its consumers). */
export declare const validReleaseDescriptor: Record<string, unknown>;

/** One named structurally invalid `ReleaseDescriptor`-shaped fixture variant. */
export type InvalidReleaseDescriptorFixture = {
  name: string;
  descriptor: Record<string, unknown>;
};

/** Named structurally invalid `ReleaseDescriptor`-shaped fixture variants. */
export declare const invalidReleaseDescriptors: InvalidReleaseDescriptorFixture[];

/** One named canonical-release-path acceptance/rejection case. */
export type CanonicalReleasePathCase = {
  /** Human-readable case label. */
  name: string;
  /** The candidate path under test. */
  path: string;
  /** Whether `path` must be accepted as canonical. */
  valid: boolean;
};

/** Shared canonical-release-path acceptance/rejection corpus. */
export declare const canonicalReleasePathCases: CanonicalReleasePathCase[];
