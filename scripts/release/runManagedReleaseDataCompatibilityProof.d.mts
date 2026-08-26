export declare const MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL: string;
export declare const MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC: string;

export type RunManagedReleaseDataCompatibilityProofOptions = {
  stagedWorkDir: string;
  channel: 'stable' | 'develop';
  previousReleaseNumbers: number[];
  candidateReleaseNumber: number;
};

export declare function runManagedReleaseDataCompatibilityProof(
  options: RunManagedReleaseDataCompatibilityProofOptions,
  deps?: unknown,
): Promise<{ passed: boolean }>;
