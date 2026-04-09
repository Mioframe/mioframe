import { createGlobalState } from '@vueuse/core';
import type { ClientObject } from '../proxyService';
import { createClient } from '../proxyService';
import { transformers } from './workerTransformerMap';
import type { DomainError } from '../error';

export const defineWorkerClient = <T extends Record<string, unknown>>(
  worker: Worker,
  serviceId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- for interface description only
  _setup: () => T,
) =>
  createGlobalState((): ClientObject<T, DomainError | FileSystemHandle> => {
    return createClient<T, DomainError | FileSystemHandle>(worker, serviceId, transformers);
  });
