import { loadEnv } from 'vite';

function getDefaultMode(processEnv) {
  return processEnv.MODE ?? processEnv.NODE_ENV ?? 'development';
}

/**
 * Load Vite-style project env files for script usage without filtering to `VITE_*`.
 * This returns the loaded key/value pairs and does not mutate `process.env`.
 * @param options Options for env loading.
 * @param options.envDir Directory containing `.env*` files.
 * @param options.mode Explicit Vite mode. Defaults to MODE, then NODE_ENV, then development.
 * @param options.processEnv Source environment used for default mode selection.
 * @returns Loaded env key/value pairs from Vite.
 */
export function loadProjectEnv({ envDir = process.cwd(), mode, processEnv = process.env } = {}) {
  return loadEnv(mode ?? getDefaultMode(processEnv), envDir, '');
}

/**
 * Merge loaded env values into a target process env without overwriting
 * existing shell or CI-provided values.
 * @param options Merge options.
 * @param options.loadedEnv Env values returned by Vite loadEnv.
 * @param options.processEnv Target process env object to mutate.
 * @returns The mutated process env object.
 */
export function mergeProjectEnv({ loadedEnv, processEnv = process.env }) {
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
 * @param options.envDir Directory containing `.env*` files.
 * @param options.mode Explicit Vite mode. Defaults to MODE, then NODE_ENV, then development.
 * @param options.processEnv Target process env object to mutate.
 * @returns The mutated process env object.
 */
export function applyProjectEnv(options = {}) {
  const { processEnv = process.env } = options;
  const loadedEnv = loadProjectEnv({ ...options, processEnv });

  return mergeProjectEnv({ loadedEnv, processEnv });
}
