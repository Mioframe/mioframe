export declare function resolveArtifactBasePath(argv?: string[], env?: NodeJS.ProcessEnv): string;

export declare function resolveArtifactDistDir(argv?: string[]): string;

export declare function runBuildArtifact(
  argv?: string[],
  deps?: unknown,
  env?: NodeJS.ProcessEnv,
): Promise<void>;
