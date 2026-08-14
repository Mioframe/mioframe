import { loadEnv } from 'vite';

/** Options for loading Vite-style project env files. */
export interface LoadProjectEnvOptions {
  /** Directory containing `.env*` files. */
  envDir?: string;
  /** Explicit Vite mode. Defaults to MODE, then NODE_ENV, then development. */
  mode?: string;
  /** Source environment used for default mode selection. */
  processEnv?: NodeJS.ProcessEnv;
}

function getDefaultMode(processEnv: NodeJS.ProcessEnv): string {
  return processEnv.MODE ?? processEnv.NODE_ENV ?? 'development';
}

/**
 * Load Vite-style project env files for script usage without filtering to `VITE_*`.
 * This returns the loaded key/value pairs and does not mutate `process.env`.
 * @param options Options for env loading.
 * @returns Loaded env key/value pairs from Vite.
 */
export function loadProjectEnv({
  envDir = process.cwd(),
  mode,
  processEnv = process.env,
}: LoadProjectEnvOptions = {}): Record<string, string> {
  return loadEnv(mode ?? getDefaultMode(processEnv), envDir, '');
}

/** Options for merging loaded env values into a target process env. */
export interface MergeProjectEnvOptions {
  /** Env values returned by Vite loadEnv. */
  loadedEnv: Record<string, string>;
  /** Target process env object to mutate. */
  processEnv?: NodeJS.ProcessEnv;
}

/**
 * Merge loaded env values into a target process env without overwriting
 * existing shell or CI-provided values.
 * @param options Merge options.
 * @returns The mutated process env object.
 */
export function mergeProjectEnv({
  loadedEnv,
  processEnv = process.env,
}: MergeProjectEnvOptions): NodeJS.ProcessEnv {
  for (const [key, value] of Object.entries(loadedEnv)) {
    if (processEnv[key] === undefined) {
      processEnv[key] = value;
    }
  }

  return processEnv;
}

/**
 * Load Vite-style project env files and merge missing values into process env.
 * @param options Options for env loading and merging.
 * @returns The mutated process env object.
 */
export function applyProjectEnv(options: LoadProjectEnvOptions = {}): NodeJS.ProcessEnv {
  const { processEnv = process.env } = options;
  const loadedEnv = loadProjectEnv({ ...options, processEnv });

  return mergeProjectEnv({ loadedEnv, processEnv });
}
